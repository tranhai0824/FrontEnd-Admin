/* eslint-disable @typescript-eslint/no-explicit-any */
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHash } from "node:crypto";
import { AuthService } from "./auth.service";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

function createHarness(role = "ADMIN") {
  const refreshTokens = new Map<string, any>();
  const user = {
    id: "user-1",
    email: "admin@example.com",
    passwordHash: "hash",
    role,
    status: "ACTIVE",
    deletedAt: null,
  };
  let sequence = 0;

  const refreshToken = {
    create: jest.fn(async ({ data }: any) => {
      const record = { id: `rt-${++sequence}`, revokedAt: null, createdAt: new Date(), updatedAt: new Date(), ...data };
      refreshTokens.set(data.tokenHash, record);
      return record;
    }),
    findUnique: jest.fn(async ({ where }: any) => {
      const record = refreshTokens.get(where.tokenHash);
      return record ? { ...record, user } : null;
    }),
    updateMany: jest.fn(async ({ where, data }: any) => {
      const record = [...refreshTokens.values()].find((item) => item.id === where.id || item.tokenHash === where.tokenHash);
      if (!record || (where.revokedAt === null && record.revokedAt !== null)) return { count: 0 };
      Object.assign(record, data);
      return { count: 1 };
    }),
  };
  const client = {
    user: {
      findUnique: jest.fn(async () => user),
      update: jest.fn(async () => user),
    },
    refreshToken,
    auditLog: { create: jest.fn(async ({ data }: any) => data) },
    $transaction: jest.fn(async (operation: any) => Array.isArray(operation)
      ? Promise.all(operation)
      : operation({ refreshToken, auditLog: { create: jest.fn(async ({ data }: any) => data) } })),
  };

  const service = new AuthService(
    { client } as any,
    { verify: jest.fn(async () => true) } as any,
    new JwtService(),
    { get: jest.fn((key: string) => key === "jwt.accessSecret" ? "test-secret" : undefined) } as unknown as ConfigService,
  );

  return { service, client, refreshTokens };
}

describe("AuthService admin session security", () => {
  it("rejects a candidate even when the password is correct", async () => {
    const { service } = createHarness("CANDIDATE");
    await expect(service.login("admin@example.com", "correct")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rotates refresh tokens atomically and rejects reuse", async () => {
    const { service, client, refreshTokens } = createHarness();
    const login = await service.login("admin@example.com", "correct");
    const refreshed = await service.refresh(login.refreshToken);

    expect(refreshed.refreshToken).not.toBe(login.refreshToken);
    expect(client.$transaction).toHaveBeenCalledTimes(2);
    expect(refreshTokens.get(hash(login.refreshToken)).revokedAt).toBeInstanceOf(Date);
    await expect(service.refresh(login.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("revokes the active refresh token on logout", async () => {
    const { service, refreshTokens } = createHarness();
    const login = await service.login("admin@example.com", "correct");

    await expect(service.logout(login.refreshToken)).resolves.toEqual({ success: true });
    expect(refreshTokens.get(hash(login.refreshToken)).revokedAt).toBeInstanceOf(Date);
    await expect(service.refresh(login.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
