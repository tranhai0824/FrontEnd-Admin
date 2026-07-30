import {
  HttpStatus,
  Injectable,
  Optional,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate, type ValidationError } from "class-validator";
import { AuditAction, Prisma, UserStatus } from "@scholarship/database";
import { RegisterDto, normalizeEmail } from "../dto/register.dto";
import { RateLimitExceededException } from "../errors/rate-limit-exceeded.exception";
import { OtpQueueProducer } from "../queues/otp-queue.producer";
import { UsersRepository } from "../repositories/users.repository";
import {
  REGISTER_GENERIC_MESSAGE,
  type NormalizedRegisterInput,
  type RegisterContext,
  type RegisterResult,
  type RegisterUser,
} from "../types/register.types";
import { AuditLogService } from "./audit-log.service";
import { OtpService } from "./otp.service";
import { PasswordHashService } from "./password-hash.service";
import { RegisterRedisService } from "./register-redis.service";
import { SecurityHashService } from "./security-hash.service";
import { ConfigService } from "@nestjs/config";
import { SystemSettingsService } from "../../../infrastructure/settings/system-settings.service";

@Injectable()
export class RegisterService {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly configService: ConfigService,
    private readonly otpQueueProducer: OtpQueueProducer,
    private readonly otpService: OtpService,
    private readonly passwordHashService: PasswordHashService,
    private readonly registerRedisService: RegisterRedisService,
    private readonly securityHashService: SecurityHashService,
    private readonly usersRepository: UsersRepository,
    @Optional() private readonly systemSettings?: SystemSettingsService,
  ) {}

  async register(rawBody: unknown, context: RegisterContext): Promise<RegisterResult> {
    const startedAt = Date.now();
    const registrationEnabled = await this.systemSettings?.getOptionalRuntimeValue<boolean>("registration.enabled");
    if (registrationEnabled === false) {
      throw new ServiceUnavailableException("Hệ thống đang tạm ngừng tiếp nhận đăng ký mới.");
    }
    const ip = this.normalizeIp(context.ip);
    const ipHash = this.securityHashService.hashIdentifier(`ip:${ip}`);

    const input = await this.validateInput(rawBody, ipHash);
    const accountKey = this.getAccountKey(input);
    const accountKeyHash = this.securityHashService.hashIdentifier(accountKey);

    const rateLimit = await this.registerRedisService.checkRegisterRateLimit(ipHash, accountKeyHash);

    if (!rateLimit.allowed) {
      await this.safeAudit({
        action: AuditAction.REGISTER_RATE_LIMITED,
        accountKeyHash,
        ipHash,
        metadata: {
          reason: "register_rate_limit",
        },
      });

      throw new RateLimitExceededException(rateLimit.retryAfterSeconds);
    }

    const existingUser = await this.usersRepository.findByEmail(input.email);

    if (existingUser) {
      const result = await this.handleExistingUser(
        input,
        existingUser,
        accountKeyHash,
        ipHash,
        startedAt,
      );

      return {
        ...result,
        headers: {
          rateLimitRemaining: rateLimit.remaining,
        },
      };
    }

    const result = await this.handleNewUser(input, accountKeyHash, ipHash, startedAt);

    return {
      ...result,
      headers: {
        rateLimitRemaining: rateLimit.remaining,
      },
    };
  }

  private async validateInput(rawBody: unknown, ipHash: string): Promise<NormalizedRegisterInput> {
    const dto = plainToInstance(RegisterDto, rawBody);
    const validationErrors = await validate(dto, {
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      whitelist: true,
    });

    if (validationErrors.length > 0) {
      const accountKeyHash = this.tryBuildAccountKeyHash(dto);

      await this.safeAudit({
        action: AuditAction.REGISTER_VALIDATION_FAILED,
        accountKeyHash,
        ipHash,
        metadata: {
          errors: this.toValidationAuditErrors(validationErrors),
        },
      });

      throw new UnprocessableEntityException({
        code: "VALIDATION_ERROR",
        message: "Invalid registration input.",
        errors: this.toValidationResponseErrors(validationErrors),
      });
    }

    return {
      email: dto.email,
      password: dto.password,
    };
  }

  private async handleExistingUser(
    input: NormalizedRegisterInput,
    user: RegisterUser,
    accountKeyHash: string,
    ipHash: string,
    startedAt: number,
  ): Promise<Omit<RegisterResult, "headers">> {
    const throttle = await this.registerRedisService.acquireResendThrottle(accountKeyHash);

    if (!throttle.allowed) {
      await this.safeAudit({
        action: AuditAction.REGISTER_RATE_LIMITED,
        actorId: user.id,
        entityType: "User",
        entityId: user.id,
        accountKeyHash,
        ipHash,
        metadata: {
          reason: "otp_resend_throttle",
        },
      });

      throw new RateLimitExceededException(throttle.retryAfterSeconds);
    }

    // Dummy argon2id hash makes the existing-account branch closer to the new-account branch.
    // This reduces timing signal for account enumeration without storing the result.
    await this.passwordHashService.hash(input.password);

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      await this.issueRegisterOtp(input, accountKeyHash);

      await this.safeAudit({
        action: AuditAction.REGISTER_OTP_RESENT,
        actorId: user.id,
        entityType: "User",
        entityId: user.id,
        accountKeyHash,
        ipHash,
      });

      await this.safeAudit({
        action: AuditAction.REGISTER_OTP_SENT,
        actorId: user.id,
        entityType: "User",
        entityId: user.id,
        accountKeyHash,
        ipHash,
      });
    }

    await this.padEnumerationTiming(startedAt);

    return this.acceptedResult();
  }

  private async handleNewUser(
    input: NormalizedRegisterInput,
    accountKeyHash: string,
    ipHash: string,
    startedAt: number,
  ): Promise<Omit<RegisterResult, "headers">> {
    const passwordHash = await this.passwordHashService.hash(input.password);
    let user: RegisterUser;

    try {
      user = await this.usersRepository.createPendingVerification({
        ...input,
        passwordHash,
      });
    } catch (error) {
      if (!this.usersRepository.isUniqueConstraintError(error)) {
        throw error;
      }

      const existingUser = await this.usersRepository.findByEmail(input.email);

      if (!existingUser) {
        throw error;
      }

      // Another request created this user. Its winning request owns OTP issuance;
      // returning the same generic response keeps this conflict idempotent.
      await this.padEnumerationTiming(startedAt);
      return this.acceptedResult();
    }

    await this.registerRedisService.acquireResendThrottle(accountKeyHash);
    await this.issueRegisterOtp(input, accountKeyHash);

    await this.safeAudit({
      action: AuditAction.REGISTER_CREATED,
      actorId: user.id,
      entityType: "User",
      entityId: user.id,
      accountKeyHash,
      ipHash,
    });

    await this.safeAudit({
      action: AuditAction.REGISTER_OTP_SENT,
      actorId: user.id,
      entityType: "User",
      entityId: user.id,
      accountKeyHash,
      ipHash,
    });

    await this.padEnumerationTiming(startedAt);

    return this.acceptedResult();
  }

  private async issueRegisterOtp(
    input: NormalizedRegisterInput,
    accountKeyHash: string,
  ): Promise<void> {
    const otp = this.otpService.generate();
    const payload = this.otpService.buildPayload(accountKeyHash, otp);

    await this.registerRedisService.storeRegisterOtp(accountKeyHash, payload);
    try {
      await this.otpQueueProducer.enqueueRegisterOtp({
        recipient: input.email,
        otp,
        purpose: "REGISTER_VERIFY",
        channel: "email",
      });
    } catch {
      await this.registerRedisService.rollbackOtpIssue(accountKeyHash, payload.otpHash);
      throw new ServiceUnavailableException({
        code: "VERIFICATION_REQUIRED",
        message: "Verification email could not be queued. Please retry.",
      });
    }
  }

  private getAccountKey(input: Pick<NormalizedRegisterInput, "email">): string {
    return `email:${input.email}`;
  }

  private normalizeIp(ip: string | undefined): string {
    return (ip ?? "unknown").replace(/^::ffff:/, "");
  }

  private tryBuildAccountKeyHash(input: Pick<RegisterDto, "email">): string | undefined {
    const email = normalizeEmail(input.email);

    if (!email) {
      return undefined;
    }

    return this.securityHashService.hashIdentifier(this.getAccountKey({ email }));
  }

  private acceptedResult(): Omit<RegisterResult, "headers"> {
    return {
      statusCode: HttpStatus.ACCEPTED,
      body: {
        code: "OTP_SENT",
        status: "VERIFICATION_REQUIRED",
        message: REGISTER_GENERIC_MESSAGE,
      },
    };
  }

  private async padEnumerationTiming(startedAt: number): Promise<void> {
    const minMs = this.configService.get<number>("register.responseMinMs") ?? 350;
    const elapsedMs = Date.now() - startedAt;
    const remainingMs = minMs - elapsedMs;

    if (remainingMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingMs));
    }
  }

  private async safeAudit(input: {
    action: AuditAction;
    actorId?: string;
    entityType?: string;
    entityId?: string;
    accountKeyHash?: string;
    ipHash?: string;
    metadata?: Prisma.InputJsonObject;
  }): Promise<void> {
    await this.auditLogService.record({
      entityType: input.entityType ?? "Register",
      action: input.action,
      actorId: input.actorId,
      entityId: input.entityId,
      accountKeyHash: input.accountKeyHash,
      ipHash: input.ipHash,
      metadata: input.metadata,
    });
  }

  private toValidationResponseErrors(errors: ValidationError[]) {
    return errors.map((error) => ({
      field: error.property,
      messages: Object.values(error.constraints ?? {}),
    }));
  }

  private toValidationAuditErrors(errors: ValidationError[]) {
    return errors.map((error) => ({
      field: error.property,
      codes: Object.keys(error.constraints ?? {}),
    }));
  }
}
