import { Injectable } from "@nestjs/common";
import { AuditAction, Prisma } from "@scholarship/database";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";

interface AuditLogInput {
  action: AuditAction;
  actorId?: string;
  entityType: string;
  entityId?: string;
  accountKeyHash?: string;
  ipHash?: string;
  metadata?: Prisma.InputJsonObject;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prismaService: PrismaService) {}

  async record(input: AuditLogInput): Promise<void> {
    await this.prismaService.client.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actorId,
        entityType: input.entityType,
        entityId: input.entityId,
        accountKeyHash: input.accountKeyHash,
        ipHash: input.ipHash,
        metadata: input.metadata,
      },
    });
  }
}
