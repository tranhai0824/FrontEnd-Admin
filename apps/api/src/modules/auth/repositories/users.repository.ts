import { Injectable } from "@nestjs/common";
import { Prisma } from "@scholarship/database";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import type { NormalizedRegisterInput } from "../types/register.types";

@Injectable()
export class UsersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findByEmail(email: string) {
    return this.prismaService.client.user.findUnique({
      where: { email },
      select: {
        id: true,
        status: true,
        email: true,
      },
    });
  }

  async createPendingVerification(input: NormalizedRegisterInput & { passwordHash: string }) {
    return this.prismaService.client.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        status: "PENDING_VERIFICATION",
        emailVerified: false,
      },
      select: {
        id: true,
        status: true,
        email: true,
      },
    });
  }

  isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  }
}
