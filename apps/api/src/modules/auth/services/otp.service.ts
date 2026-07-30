import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import type { RegisterOtpPayload } from "../types/register.types";

@Injectable()
export class OtpService {
  private readonly otpHmacSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.otpHmacSecret = this.getRequiredSecret("security.otpHmacSecret");
  }

  generate(): string {
    const length = this.configService.get<number>("register.otpLength") ?? 6;
    let otp = "";

    for (let index = 0; index < length; index += 1) {
      otp += randomInt(0, 10).toString();
    }

    return otp;
  }

  hashOtp(accountKeyHash: string, otp: string): string {
    return createHmac("sha256", this.otpHmacSecret)
      .update(`${accountKeyHash}:${otp}`)
      .digest("hex");
  }

  buildPayload(accountKeyHash: string, otp: string): RegisterOtpPayload {
    const ttlSeconds = this.configService.get<number>("register.otpTtlSeconds") ?? 300;
    const maxAttempts = this.configService.get<number>("register.otpMaxAttempts") ?? 5;

    return {
      otpHash: this.hashOtp(accountKeyHash, otp),
      attempts: 0,
      maxAttempts,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };
  }

  verify(accountKeyHash: string, otp: string, storedOtpHash: string): boolean {
    const expected = Buffer.from(this.hashOtp(accountKeyHash, otp), "hex");
    const actual = Buffer.from(storedOtpHash, "hex");

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  private getRequiredSecret(path: string): string {
    const value = this.configService.get<string>(path);

    if (!value) {
      throw new Error(`${path} is required`);
    }

    return value;
  }
}
