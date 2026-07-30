import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { ADMIN_ROLES } from "@scholarship/shared";
import { createHash, randomBytes } from "node:crypto";
import { authenticator } from "otplib";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { PasswordHashService } from "./password-hash.service";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHash: PasswordHashService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string, otp?: string): Promise<AuthTokens & { user: { id: string; email: string; role: string } }> {
    const user = await this.prisma.client.user.findUnique({ where: { email: email.toLowerCase() } });
    if (
      !user ||
      !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number]) ||
      user.status !== "ACTIVE" ||
      user.deletedAt !== null ||
      !(await this.passwordHash.verify(user.passwordHash, password))
    ) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    }

    if (user.totpEnabled && (!user.totpSecret || !otp || !authenticator.check(otp, user.totpSecret))) {
      throw new UnauthorizedException("Mã xác thực hai lớp không đúng");
    }

    const tokens = await this.issueTokens(user.id, user.email ?? email, user.role);
    await this.prisma.client.$transaction([
      this.prisma.client.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
      this.prisma.client.auditLog.create({
        data: {
          actorId: user.id,
          action: "ADMIN_LOGIN_SUCCEEDED",
          entityType: "User",
          entityId: user.id,
          metadata: { role: user.role },
        },
      }),
    ]);
    return { ...tokens, user: { id: user.id, email: user.email ?? email, role: user.role } };
  }

  async refresh(refreshToken?: string): Promise<AuthTokens & { user: { id: string; email: string | null; role: string } }> {
    if (!refreshToken) throw new UnauthorizedException("Phiên đăng nhập không hợp lệ");

    const stored = await this.prisma.client.refreshToken.findUnique({
      where: { tokenHash: this.hash(refreshToken) },
      include: { user: true },
    });
    if (!stored) throw new UnauthorizedException("Phiên đăng nhập đã hết hạn");
    if (stored.revokedAt) {
      await this.prisma.client.auditLog.create({
        data: {
          actorId: stored.userId,
          action: "ADMIN_REFRESH_REUSE_BLOCKED",
          entityType: "RefreshToken",
          entityId: stored.id,
        },
      });
      throw new UnauthorizedException("Refresh token đã được sử dụng");
    }
    if (
      stored.expiresAt <= new Date() ||
      !ADMIN_ROLES.includes(stored.user.role as (typeof ADMIN_ROLES)[number]) ||
      stored.user.status !== "ACTIVE" ||
      stored.user.deletedAt !== null
    ) {
      throw new UnauthorizedException("Phiên đăng nhập đã hết hạn");
    }

    const tokens = await this.createTokenPair(stored.userId, stored.user.email ?? "", stored.user.role);
    const rotated = await this.prisma.client.$transaction(async (transaction) => {
      const revoked = await transaction.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (revoked.count !== 1) return false;

      await transaction.refreshToken.create({
        data: {
          tokenHash: this.hash(tokens.refreshToken),
          userId: stored.userId,
          expiresAt: this.refreshExpiresAt(),
        },
      });
      await transaction.auditLog.create({
        data: {
          actorId: stored.userId,
          action: "ADMIN_REFRESH_ROTATED",
          entityType: "RefreshToken",
          entityId: stored.id,
        },
      });
      return true;
    });
    if (!rotated) {
      await this.prisma.client.auditLog.create({
        data: {
          actorId: stored.userId,
          action: "ADMIN_REFRESH_REUSE_BLOCKED",
          entityType: "RefreshToken",
          entityId: stored.id,
          metadata: { reason: "concurrent_rotation" },
        },
      });
      throw new UnauthorizedException("Refresh token đã được sử dụng");
    }

    return { ...tokens, user: { id: stored.user.id, email: stored.user.email, role: stored.user.role } };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      const stored = await this.prisma.client.refreshToken.findUnique({
        where: { tokenHash: this.hash(refreshToken) },
      });
      await this.prisma.client.$transaction(async (transaction) => {
        await transaction.refreshToken.updateMany({
          where: { tokenHash: this.hash(refreshToken), revokedAt: null },
          data: { revokedAt: new Date() },
        });
        if (stored) {
          await transaction.auditLog.create({
            data: {
              actorId: stored.userId,
              action: "ADMIN_LOGOUT",
              entityType: "RefreshToken",
              entityId: stored.id,
            },
          });
        }
      });
    }
    return { success: true };
  }

  private async issueTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    const tokens = await this.createTokenPair(userId, email, role);
    await this.prisma.client.refreshToken.create({
      data: {
        tokenHash: this.hash(tokens.refreshToken),
        userId,
        expiresAt: this.refreshExpiresAt(),
      },
    });
    return tokens;
  }

  private async createTokenPair(userId: string, email: string, role: string): Promise<AuthTokens> {
    const accessSecret = this.config.get<string>("jwt.accessSecret") ?? "development-access-secret";
    const expiresIn = this.config.get<string>("jwt.accessExpiresIn") ?? "15m";
    const accessToken = await this.jwt.signAsync({ sub: userId, email, role }, { secret: accessSecret, expiresIn });
    return {
      accessToken,
      refreshToken: randomBytes(48).toString("base64url"),
      expiresIn,
    };
  }

  private refreshExpiresAt() {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  private hash(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }
}
