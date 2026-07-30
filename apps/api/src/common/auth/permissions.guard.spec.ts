/* eslint-disable @typescript-eslint/no-explicit-any */
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { PERMISSIONS } from "@scholarship/shared";
import { PermissionsGuard } from "./permissions.guard";
import { PERMISSIONS_KEY } from "./permissions.decorator";

function contextWith(token?: string) {
  const request = { headers: token ? { authorization: `Bearer ${token}` } : {} } as any;
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class TestController {},
  } as unknown as ExecutionContext;
}

function unconfiguredAdminContext() {
  const request = { headers: {}, path: "/api/v1/admin/future-endpoint" };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class TestController {},
  } as unknown as ExecutionContext;
}

describe("PermissionsGuard", () => {
  const jwt = new JwtService();
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => key === PERMISSIONS_KEY ? [PERMISSIONS.AUDIT_READ] : undefined),
  } as unknown as Reflector;
  const config = {
    get: jest.fn(() => "test-secret"),
  } as unknown as ConfigService;
  const guard = new PermissionsGuard(reflector, jwt, config);

  it("returns 401 without a bearer token", async () => {
    await expect(guard.canActivate(contextWith())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("returns 403 when MODERATOR calls an ADMIN audit endpoint", async () => {
    const token = await jwt.signAsync({ sub: "moderator-1", role: "MODERATOR" }, { secret: "test-secret" });
    await expect(guard.canActivate(contextWith(token))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows ADMIN to call the protected audit endpoint", async () => {
    const token = await jwt.signAsync({ sub: "admin-1", role: "ADMIN" }, { secret: "test-secret" });
    await expect(guard.canActivate(contextWith(token))).resolves.toBe(true);
  });

  it("fails closed when a future admin endpoint has no permission metadata", async () => {
    const noPolicyReflector = {
      getAllAndOverride: jest.fn(() => undefined),
    } as unknown as Reflector;
    const closedGuard = new PermissionsGuard(noPolicyReflector, jwt, config);

    await expect(closedGuard.canActivate(unconfiguredAdminContext())).rejects.toBeInstanceOf(ForbiddenException);
  });
});
