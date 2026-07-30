import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../../../infrastructure/redis/redis.service";
import type { RegisterOtpPayload } from "../types/register.types";

interface RateLimitHit {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface RegisterRateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface ResendThrottleResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const RATE_LIMIT_LUA = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[2])
end
local ttl = redis.call("TTL", KEYS[1])
local remaining = tonumber(ARGV[1]) - current
if remaining < 0 then
  remaining = 0
end
return {current, remaining, ttl}
`;

@Injectable()
export class RegisterRedisService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async checkRegisterRateLimit(
    ip: string,
    accountKeyHash: string,
  ): Promise<RegisterRateLimitResult> {
    const windowSeconds = this.configService.get<number>("register.rateLimitWindowSeconds") ?? 900;
    const ipMax = this.configService.get<number>("register.rateLimitIpMax") ?? 10;
    const accountMax = this.configService.get<number>("register.rateLimitAccMax") ?? 5;

    const [ipLimit, accountLimit] = await Promise.all([
      this.hitRateLimit(`rate:register:ip:${ip}`, ipMax, windowSeconds),
      this.hitRateLimit(`rate:register:acc:${accountKeyHash}`, accountMax, windowSeconds),
    ]);

    const allowed = ipLimit.allowed && accountLimit.allowed;

    return {
      allowed,
      remaining: Math.min(ipLimit.remaining, accountLimit.remaining),
      retryAfterSeconds: Math.max(ipLimit.retryAfterSeconds, accountLimit.retryAfterSeconds),
    };
  }

  async acquireResendThrottle(accountKeyHash: string): Promise<ResendThrottleResult> {
    const seconds = this.configService.get<number>("register.otpResendSeconds") ?? 60;
    const key = `otp:resend:${accountKeyHash}`;
    const result = await this.redisService.client.set(key, "1", "EX", seconds, "NX");

    if (result === "OK") {
      return {
        allowed: true,
        retryAfterSeconds: 0,
      };
    }

    const ttl = await this.redisService.client.ttl(key);

    return {
      allowed: false,
      retryAfterSeconds: Math.max(ttl, 1),
    };
  }

  async storeRegisterOtp(accountKeyHash: string, payload: RegisterOtpPayload): Promise<void> {
    const ttlSeconds = this.configService.get<number>("register.otpTtlSeconds") ?? 300;

    // Redis key contract:
    // - otp:register:{accountKeyHash} stores only the HMAC hash, never the raw OTP.
    // - SET overwrites older OTPs on resend so only the latest code is valid.
    await this.redisService.client.set(
      `otp:register:${accountKeyHash}`,
      JSON.stringify(payload),
      "EX",
      ttlSeconds,
    );
  }

  async rollbackOtpIssue(accountKeyHash: string, otpHash: string): Promise<void> {
    const key = `otp:register:${accountKeyHash}`;
    const stored = await this.redisService.client.get(key);
    if (!stored) return;
    const payload = JSON.parse(stored) as RegisterOtpPayload;
    if (payload.otpHash === otpHash) await this.redisService.client.del(key);
  }

  private async hitRateLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number,
  ): Promise<RateLimitHit> {
    // Atomic fixed-window increment. It avoids INCR/EXPIRE races for:
    // - rate:register:ip:{ip}
    // - rate:register:acc:{accountKeyHash}
    const result = (await this.redisService.client.eval(
      RATE_LIMIT_LUA,
      1,
      key,
      maxRequests,
      windowSeconds,
    )) as [number, number, number];

    const [current, remaining, ttl] = result.map(Number) as [number, number, number];

    return {
      allowed: current <= maxRequests,
      remaining,
      retryAfterSeconds: Math.max(ttl, 1),
    };
  }
}
