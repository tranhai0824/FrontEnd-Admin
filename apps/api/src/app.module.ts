import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import configuration from "./config/configuration";
import { MailModule } from "./infrastructure/mail/mail.module";
import { PrismaModule } from "./infrastructure/prisma/prisma.module";
import { RedisModule } from "./infrastructure/redis/redis.module";
import { StorageModule } from "./infrastructure/storage/storage.module";
import { SettingsModule } from "./infrastructure/settings/settings.module";
import { AdminModule } from "./modules/admin/admin.module";
import { ApplicationsModule } from "./modules/applications/applications.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ConsultingModule } from "./modules/consulting/consulting.module";
import { FilesModule } from "./modules/files/files.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { ScholarshipsModule } from "./modules/scholarships/scholarships.module";
import { UsersModule } from "./modules/users/users.module";
import { PermissionsGuard } from "./common/auth/permissions.guard";

function redisConnectionFromConfig(configService: ConfigService) {
  const redisUrl = configService.get<string>("redis.url");

  if (redisUrl) {
    const parsedUrl = new URL(redisUrl);

    return {
      host: parsedUrl.hostname,
      port: Number.parseInt(parsedUrl.port || "6379", 10),
      username: parsedUrl.username || undefined,
      password: parsedUrl.password ? decodeURIComponent(parsedUrl.password) : undefined,
      tls: parsedUrl.protocol === "rediss:" ? {} : undefined,
    };
  }

  return {
    host: configService.get<string>("redis.host") ?? "localhost",
    port: configService.get<number>("redis.port") ?? 6379,
    password: configService.get<string>("redis.password"),
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env.local", "../../.env", ".env.local", ".env"],
      load: [configuration],
    }),
    JwtModule.register({}),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: redisConnectionFromConfig(configService),
      }),
    }),
    PrismaModule,
    SettingsModule,
    RedisModule,
    StorageModule,
    MailModule,
    AuthModule,
    UsersModule,
    ScholarshipsModule,
    ApplicationsModule,
    OrganizationsModule,
    ConsultingModule,
    NotificationsModule,
    FilesModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
