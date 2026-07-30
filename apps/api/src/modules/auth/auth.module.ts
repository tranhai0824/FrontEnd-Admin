import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AuthController } from "./auth.controller";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module";
import { RedisModule } from "../../infrastructure/redis/redis.module";
import { OtpQueueProducer } from "./queues/otp-queue.producer";
import { UsersRepository } from "./repositories/users.repository";
import { AuditLogService } from "./services/audit-log.service";
import { OtpService } from "./services/otp.service";
import { PasswordHashService } from "./services/password-hash.service";
import { RegisterRedisService } from "./services/register-redis.service";
import { RegisterService } from "./services/register.service";
import { AuthService } from "./services/auth.service";
import { SecurityHashService } from "./services/security-hash.service";
import { LoginRateLimitService } from "./services/login-rate-limit.service";
import { NOTIFY_QUEUE_NAME } from "./types/register.types";

@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFY_QUEUE_NAME,
    }),
    PrismaModule,
    RedisModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuditLogService,
    AuthService,
    OtpQueueProducer,
    OtpService,
    PasswordHashService,
    RegisterRedisService,
    RegisterService,
    SecurityHashService,
    LoginRateLimitService,
    UsersRepository,
  ],
  exports: [PasswordHashService],
})
export class AuthModule {}
