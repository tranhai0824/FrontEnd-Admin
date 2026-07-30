import { HttpStatus, UnprocessableEntityException } from "@nestjs/common";
import { AuditAction, UserStatus } from "@scholarship/database";
import { RateLimitExceededException } from "../errors/rate-limit-exceeded.exception";
import { RegisterService } from "./register.service";

function createService() {
  const auditLogService = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const configService = {
    get: jest.fn((key: string) => (key === "register.responseMinMs" ? 0 : undefined)),
  };
  const otpQueueProducer = {
    enqueueRegisterOtp: jest.fn().mockResolvedValue(undefined),
  };
  const otpService = {
    generate: jest.fn().mockReturnValue("123456"),
    buildPayload: jest.fn().mockReturnValue({
      otpHash: "otp-hash",
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
    }),
  };
  const passwordHashService = {
    hash: jest.fn().mockResolvedValue("argon2id-hash"),
  };
  const registerRedisService = {
    checkRegisterRateLimit: jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 4,
      retryAfterSeconds: 0,
    }),
    acquireResendThrottle: jest.fn().mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    }),
    storeRegisterOtp: jest.fn().mockResolvedValue(undefined),
  };
  const securityHashService = {
    hashIdentifier: jest.fn((value: string) => `hash:${value}`),
  };
  const usersRepository = {
    findByEmail: jest.fn(),
    createPendingVerification: jest.fn(),
    isUniqueConstraintError: jest.fn().mockReturnValue(false),
  };

  const service = new RegisterService(
    auditLogService,
    configService,
    otpQueueProducer,
    otpService,
    passwordHashService,
    registerRedisService,
    securityHashService,
    usersRepository,
  );

  return {
    auditLogService,
    otpQueueProducer,
    otpService,
    passwordHashService,
    registerRedisService,
    securityHashService,
    service,
    usersRepository,
  };
}

describe("RegisterService", () => {
  const context = {
    ip: "127.0.0.1",
    userAgent: "jest",
  };

  it("creates a pending-verification user and sends an OTP", async () => {
    const { auditLogService, otpQueueProducer, registerRedisService, service, usersRepository } =
      createService();

    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.createPendingVerification.mockResolvedValue({
      id: "user-1",
      status: UserStatus.PENDING_VERIFICATION,
      email: "candidate@example.com",
      phone: null,
    });

    const result = await service.register(
      {
        email: " Candidate@Example.COM ",
        password: "StrongPass1!",
        confirmPassword: "StrongPass1!",
      },
      context,
    );

    expect(result.statusCode).toBe(HttpStatus.ACCEPTED);
    expect(result.body.code).toBe("OTP_SENT");
    expect(usersRepository.findByEmail).toHaveBeenCalledWith("candidate@example.com");
    expect(usersRepository.createPendingVerification).toHaveBeenCalledWith({
      email: "candidate@example.com",
      password: "StrongPass1!",
      passwordHash: "argon2id-hash",
    });
    expect(registerRedisService.storeRegisterOtp).toHaveBeenCalledWith(
      "hash:email:candidate@example.com",
      expect.objectContaining({
        otpHash: "otp-hash",
      }),
    );
    expect(otpQueueProducer.enqueueRegisterOtp).toHaveBeenCalledWith({
      channel: "email",
      recipient: "candidate@example.com",
      otp: "123456",
      purpose: "REGISTER_VERIFY",
    });
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.REGISTER_CREATED,
        actorId: "user-1",
      }),
    );
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.REGISTER_OTP_SENT,
        actorId: "user-1",
      }),
    );
  });

  it("resends an OTP for an existing unverified account without revealing existence", async () => {
    const { auditLogService, otpQueueProducer, passwordHashService, service, usersRepository } =
      createService();

    usersRepository.findByEmail.mockResolvedValue({
      id: "user-2",
      status: UserStatus.PENDING_VERIFICATION,
      email: "candidate@example.com",
      phone: null,
    });

    const result = await service.register(
      {
        email: "candidate@example.com",
        password: "StrongPass1!",
        confirmPassword: "StrongPass1!",
      },
      context,
    );

    expect(result.statusCode).toBe(HttpStatus.ACCEPTED);
    expect(result.body.code).toBe("OTP_SENT");
    expect(passwordHashService.hash).toHaveBeenCalledWith("StrongPass1!");
    expect(usersRepository.createPendingVerification).not.toHaveBeenCalled();
    expect(otpQueueProducer.enqueueRegisterOtp).toHaveBeenCalled();
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.REGISTER_OTP_RESENT,
        actorId: "user-2",
      }),
    );
  });

  it("rejects resend when resend throttle is active", async () => {
    const { otpQueueProducer, registerRedisService, service, usersRepository } = createService();

    usersRepository.findByEmail.mockResolvedValue({
      id: "user-3",
      status: UserStatus.PENDING_VERIFICATION,
      email: "candidate@example.com",
      phone: null,
    });
    registerRedisService.acquireResendThrottle.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 44,
    });

    await expect(
      service.register(
        {
          email: "candidate@example.com",
          password: "StrongPass1!",
          confirmPassword: "StrongPass1!",
        },
        context,
      ),
    ).rejects.toMatchObject({
      retryAfterSeconds: 44,
    });

    expect(otpQueueProducer.enqueueRegisterOtp).not.toHaveBeenCalled();
  });

  it("rejects when register rate limit is exceeded", async () => {
    const { registerRedisService, service, usersRepository } = createService();

    registerRedisService.checkRegisterRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 120,
    });

    await expect(
      service.register(
        {
          email: "candidate@example.com",
          password: "StrongPass1!",
          confirmPassword: "StrongPass1!",
        },
        context,
      ),
    ).rejects.toBeInstanceOf(RateLimitExceededException);

    expect(usersRepository.findByEmail).not.toHaveBeenCalled();
  });

  it("audits and returns 422 for validation errors", async () => {
    const { auditLogService, registerRedisService, service } = createService();

    await expect(
      service.register(
        {
          email: "not-an-email",
          password: "weak",
          confirmPassword: "different",
        },
        context,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(registerRedisService.checkRegisterRateLimit).not.toHaveBeenCalled();
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.REGISTER_VALIDATION_FAILED,
      }),
    );
  });
});
