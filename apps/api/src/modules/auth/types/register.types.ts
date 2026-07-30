import type { User } from "@scholarship/database";

export type RegisterChannel = "email";

export const REGISTER_GENERIC_MESSAGE =
  "If the information is valid, we have sent a verification code.";

export const NOTIFY_QUEUE_NAME = "notify";
export const SEND_REGISTER_OTP_JOB = "send-register-otp";

export interface RegisterContext {
  ip: string;
  userAgent?: string;
}

export interface NormalizedRegisterInput {
  email: string;
  password: string;
}

export interface RegisterResult {
  statusCode: 202;
  body: {
    code: "OTP_SENT";
    status: "VERIFICATION_REQUIRED";
    message: string;
  };
  headers: {
    rateLimitRemaining: number;
  };
}

export interface RegisterOtpPayload {
  otpHash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: string;
}

export interface SendRegisterOtpJob {
  recipient: string;
  otp: string;
  purpose: "REGISTER_VERIFY";
}

export type RegisterUser = Pick<User, "id" | "status" | "email">;
