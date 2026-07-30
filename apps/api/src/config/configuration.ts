function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function booleanFromEnv(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value === "") {
    return fallback;
  }

  return ["1", "true", "yes"].includes(value.toLowerCase());
}

export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? "development",
    apiPort: numberFromEnv(process.env.API_PORT, 4000),
    webPort: numberFromEnv(process.env.WEB_PORT, 3000),
    apiUrl: process.env.API_URL ?? "http://localhost:4000",
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000,http://localhost:3001",
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: numberFromEnv(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    url: process.env.REDIS_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },
  register: {
    rateLimitIpMax: numberFromEnv(process.env.REGISTER_RATE_LIMIT_IP_MAX, 10),
    rateLimitAccMax: numberFromEnv(process.env.REGISTER_RATE_LIMIT_ACC_MAX, 5),
    rateLimitWindowSeconds: numberFromEnv(process.env.REGISTER_RATE_LIMIT_WINDOW_SECONDS, 900),
    otpTtlSeconds: numberFromEnv(process.env.REGISTER_OTP_TTL_SECONDS, 300),
    otpMaxAttempts: numberFromEnv(process.env.REGISTER_OTP_MAX_ATTEMPTS, 5),
    otpResendSeconds: numberFromEnv(process.env.REGISTER_OTP_RESEND_SECONDS, 60),
    otpLength: numberFromEnv(process.env.REGISTER_OTP_LENGTH, 6),
    responseMinMs: numberFromEnv(process.env.REGISTER_RESPONSE_MIN_MS, 350),
  },
  login: {
    failureMax: numberFromEnv(process.env.LOGIN_FAILURE_MAX, 5),
    failureWindowSeconds: numberFromEnv(process.env.LOGIN_FAILURE_WINDOW_SECONDS, 900),
  },
  security: {
    otpHmacSecret: process.env.OTP_HMAC_SECRET,
    auditHmacSecret: process.env.AUDIT_HMAC_SECRET,
  },
  settings: {
    encryptionKey: process.env.SETTINGS_ENCRYPTION_KEY,
  },
  argon2: {
    memoryCost: numberFromEnv(process.env.ARGON2_MEMORY_COST, 19456),
    timeCost: numberFromEnv(process.env.ARGON2_TIME_COST, 2),
    parallelism: numberFromEnv(process.env.ARGON2_PARALLELISM, 1),
  },
  storage: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    bucket: process.env.S3_BUCKET,
    forcePathStyle: booleanFromEnv(process.env.S3_FORCE_PATH_STYLE, true),
  },
  mail: {
    host: process.env.SMTP_HOST ?? "localhost",
    port: numberFromEnv(process.env.SMTP_PORT, 1025),
    user: process.env.SMTP_USER || undefined,
    password: process.env.SMTP_PASSWORD || undefined,
    secure: booleanFromEnv(process.env.SMTP_SECURE),
    from: process.env.MAIL_FROM ?? "no-reply@scholarship-platform.local",
  },
});
