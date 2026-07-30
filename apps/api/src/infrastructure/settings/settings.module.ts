import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { SystemSettingsService } from "./system-settings.service";

@Global()
@Module({
  imports: [PrismaModule],
  providers: [SystemSettingsService],
  exports: [SystemSettingsService],
})
export class SettingsModule {}
