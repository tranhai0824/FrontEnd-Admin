import { Controller, Get, Patch, Post, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import type { AddressInfo } from "node:net";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { AdminController } from "./admin.controller";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PERMISSIONS } from "@scholarship/shared";

@Controller("api/v1/admin/rbac-test")
class RbacTestController {
  @Patch("settings")
  @RequirePermissions(PERMISSIONS.SETTINGS_WRITE)
  settings() { return { ok: true }; }

  @Post("scholarships/approve")
  @RequirePermissions(PERMISSIONS.SCHOLARSHIP_APPROVE)
  approveScholarship() { return { ok: true }; }

  @Post("administrators/manage")
  @RequirePermissions(PERMISSIONS.ADMIN_MANAGE)
  manageAdministrators() { return { ok: true }; }

  @Get("unconfigured")
  unconfigured() { return { ok: true }; }
}

describe("Admin RBAC HTTP integration", () => {
  let app: INestApplication;
  let baseUrl: string;
  const jwt = new JwtService();
  const transaction = {
    user: {
      findFirst: jest.fn(async () => ({ role: "CANDIDATE" })),
      count: jest.fn(async () => 2),
      updateMany: jest.fn(async () => ({ count: 1 })),
    },
    refreshToken: { updateMany: jest.fn(async () => ({ count: 2 })) },
    auditLog: { create: jest.fn(async () => ({ id: "audit-delete" })) },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminController, RbacTestController],
      providers: [
        Reflector,
        PermissionsGuard,
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: { get: () => "test-secret" } },
        {
          provide: PrismaService,
          useValue: {
            client: {
              auditLog: {
                findMany: jest.fn(async () => [{ id: "audit-1", action: "ADMIN_LOGIN_SUCCEEDED" }]),
              },
              $transaction: jest.fn(async (callback: (client: typeof transaction) => unknown) => callback(transaction)),
            },
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalGuards(module.get(PermissionsGuard));
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 401 without authentication", async () => {
    const response = await fetch(`${baseUrl}/api/v1/admin/audit-logs`);
    expect(response.status).toBe(401);
  });

  it("returns 403 for MODERATOR", async () => {
    const token = await jwt.signAsync({ sub: "moderator-1", role: "MODERATOR" }, { secret: "test-secret" });
    const response = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(403);
  });

  it("returns audit data for ADMIN", async () => {
    const token = await jwt.signAsync({ sub: "admin-1", role: "ADMIN" }, { secret: "test-secret" });
    const response = await fetch(`${baseUrl}/api/v1/admin/audit-logs?limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      items: [{ id: "audit-1", action: "ADMIN_LOGIN_SUCCEEDED" }],
    });
  });

  it("soft-deletes a user and records the operation for ADMIN", async () => {
    const token = await jwt.signAsync({ sub: "admin-1", role: "ADMIN" }, { secret: "test-secret" });
    const response = await fetch(`${baseUrl}/api/v1/admin/users/123e4567-e89b-12d3-a456-426614174000`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    expect(transaction.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "123e4567-e89b-12d3-a456-426614174000", deletedAt: null },
    }));
    expect(transaction.auditLog.create).toHaveBeenCalled();
  });

  it("returns 403 when MODERATOR calls settings.write", async () => {
    const token = await jwt.signAsync({ sub: "moderator-1", role: "MODERATOR" }, { secret: "test-secret" });
    const response = await fetch(`${baseUrl}/api/v1/admin/rbac-test/settings`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(403);
  });

  it("returns 403 when SUPPORT calls scholarship.approve", async () => {
    const token = await jwt.signAsync({ sub: "support-1", role: "SUPPORT" }, { secret: "test-secret" });
    const response = await fetch(`${baseUrl}/api/v1/admin/rbac-test/scholarships/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(403);
  });

  it("returns 403 when ADMIN calls admin.manage", async () => {
    const token = await jwt.signAsync({ sub: "admin-1", role: "ADMIN" }, { secret: "test-secret" });
    const response = await fetch(`${baseUrl}/api/v1/admin/rbac-test/administrators/manage`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(403);
  });

  it("allows SUPER_ADMIN to call all four permission groups", async () => {
    const token = await jwt.signAsync({ sub: "super-admin-1", role: "SUPER_ADMIN" }, { secret: "test-secret" });
    const headers = { Authorization: `Bearer ${token}` };
    const responses = await Promise.all([
      fetch(`${baseUrl}/api/v1/admin/rbac-test/settings`, { method: "PATCH", headers }),
      fetch(`${baseUrl}/api/v1/admin/rbac-test/scholarships/approve`, { method: "POST", headers }),
      fetch(`${baseUrl}/api/v1/admin/rbac-test/administrators/manage`, { method: "POST", headers }),
      fetch(`${baseUrl}/api/v1/admin/audit-logs`, { headers }),
    ]);
    expect(responses.map((response) => response.status)).toEqual([200, 201, 201, 200]);
  });

  it("returns 403 when CANDIDATE calls an admin endpoint", async () => {
    const token = await jwt.signAsync({ sub: "candidate-1", role: "CANDIDATE" }, { secret: "test-secret" });
    const response = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(403);
  });

  it("fails closed over HTTP for an unconfigured endpoint, even for SUPER_ADMIN", async () => {
    const token = await jwt.signAsync({ sub: "super-admin-1", role: "SUPER_ADMIN" }, { secret: "test-secret" });
    const response = await fetch(`${baseUrl}/api/v1/admin/rbac-test/unconfigured`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(403);
  });
});
