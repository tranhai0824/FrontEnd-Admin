import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module";
import { AdminController } from "./admin.controller";
import { MailModule } from "../../infrastructure/mail/mail.module";
import { AdminPartnersController } from "./admin-partners.controller";
import { AdminScholarshipsController } from "./admin-scholarships.controller";
import { AdminOperationsController } from "./admin-operations.controller";
import { RedisModule } from "../../infrastructure/redis/redis.module";
import { StorageModule } from "../../infrastructure/storage/storage.module";
import { AuthModule } from "../auth/auth.module";
import { BullModule } from "@nestjs/bullmq";
import { NOTIFY_QUEUE_NAME } from "../auth/types/register.types";
import { AdminMaintenanceService } from "./admin-maintenance.service";
import { SettingsModule } from "../../infrastructure/settings/settings.module";

@Module({
  imports: [
    PrismaModule,
    MailModule,
    RedisModule,
    StorageModule,
    AuthModule,
    SettingsModule,
    BullModule.registerQueue({ name: NOTIFY_QUEUE_NAME }),
  ],
  controllers: [AdminController, AdminScholarshipsController, AdminPartnersController, AdminOperationsController],
  providers: [AdminMaintenanceService],
})
export class AdminModule {}
