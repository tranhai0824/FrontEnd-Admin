import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../../../infrastructure/redis/redis.service";
import { RateLimitExceededException } from "../errors/rate-limit-exceeded.exception";
import { AuditLogService } from "./audit-log.service";
import { SecurityHashService } from "./security-hash.service";
import { SystemSettingsService } from "../../../infrastructure/settings/system-settings.service";

const INCREMENT_FAILURE_SCRIPT = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("TTL", KEYS[1])
return {count, ttl}
`;

@Injectable()
export class LoginRateLimitService {
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly audit: AuditLogService,
    private readonly securityHash: SecurityHashService,
    @Optional() private readonly systemSettings?: SystemSettingsService,
  ) {}

  async assertAllowed(email: string, ip: string) {
    const keys = this.keys(email, ip);
    const [ipCount, emailCount, ipTtl, emailTtl] = await Promise.all([
      this.redis.client.get(keys.ip),
      this.redis.client.get(keys.email),
      this.redis.client.ttl(keys.ip),
      this.redis.client.ttl(keys.email),
    ]);
    const max = await this.systemSettings?.getOptionalRuntimeValue<number>("login.maxFailures")
      ?? this.config.get<number>("login.failureMax")
      ?? 5;

    if (Number(ipCount ?? 0) < max && Number(emailCount ?? 0) < max) return;

    const retryAfterSeconds = Math.max(ipTtl, emailTtl, 1);
    await this.audit.record({
      action: "ADMIN_LOGIN_RATE_LIMITED",
      entityType: "AdminLogin",
      accountKeyHash: this.securityHash.hashIdentifier(`login-email:${email.toLowerCase()}`),
      ipHash: this.securityHash.hashIdentifier(`login-ip:${ip}`),
      metadata: {
        reason: "failed_login_limit",
        retryAfterSeconds,
      },
    });
    throw new RateLimitExceededException(retryAfterSeconds, "Quá nhiều lần đăng nhập thất bại.");
  }

  async recordFailure(email: string, ip: string) {
    const keys = this.keys(email, ip);
    const lockMinutes = await this.systemSettings?.getOptionalRuntimeValue<number>("login.lockMinutes");
    const windowSeconds = lockMinutes !== undefined
      ? lockMinutes * 60
      : this.config.get<number>("login.failureWindowSeconds") ?? 900;
    await Promise.all([
      this.redis.client.eval(INCREMENT_FAILURE_SCRIPT, 1, keys.ip, windowSeconds),
      this.redis.client.eval(INCREMENT_FAILURE_SCRIPT, 1, keys.email, windowSeconds),
    ]);
  }

  async clear(email: string, ip: string) {
    const keys = this.keys(email, ip);
    await this.redis.client.del(keys.ip, keys.email);
  }

  private keys(email: string, ip: string) {
    return {
      ip: `admin-login:fail:ip:${this.securityHash.hashIdentifier(ip)}`,
      email: `admin-login:fail:email:${this.securityHash.hashIdentifier(email.toLowerCase())}`,
    };
  }
}
