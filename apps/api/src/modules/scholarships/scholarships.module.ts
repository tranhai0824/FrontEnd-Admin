import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module";
import { ScholarshipsController } from "./scholarships.controller";

@Module({ imports: [PrismaModule], controllers: [ScholarshipsController] })
export class ScholarshipsModule {}
