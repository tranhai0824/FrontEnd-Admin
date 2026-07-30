import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { hasPermission, type Permission } from "@scholarship/shared";
import { ConfigService } from "@nestjs/config";
import { PERMISSIONS_KEY } from "./permissions.decorator";
import { PUBLIC_KEY } from "./public.decorator";
import { AUTHENTICATED_KEY } from "./authenticated.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly jwt: JwtService, private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    const authenticated = this.reflector.getAllAndOverride<boolean>(AUTHENTICATED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const permissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]) ?? [];
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      path?: string;
      originalUrl?: string;
      user?: { sub: string; role: string };
    }>();
    const requestPath = request.path ?? request.originalUrl ?? "";
    const isAdminEndpoint = requestPath.startsWith("/api/v1/admin");

    if (!isAdminEndpoint && !permissions.length && !authenticated) return true;
    // Fail closed: every current and future /api/v1/admin endpoint must declare
    // an explicit permission policy. Missing metadata is a server-side denial.
    if (isAdminEndpoint && !permissions.length) {
      throw new ForbiddenException("Admin endpoint has no permission policy");
    }

    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) throw new UnauthorizedException();
    try {
      request.user = await this.jwt.verifyAsync<{ sub: string; role: string }>(token, { secret: this.config.get<string>("jwt.accessSecret") ?? "development-access-secret" });
    } catch { throw new UnauthorizedException(); }
    if (permissions.length && !permissions.every((permission) => hasPermission(request.user!.role, permission))) throw new ForbiddenException();
    return true;
  }
}
