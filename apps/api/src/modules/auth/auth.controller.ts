import { Body, Controller, Headers, Ip, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import type { Request, Response } from "express";
import { LoginDto } from "./dto/login.dto";
import { RateLimitExceededException } from "./errors/rate-limit-exceeded.exception";
import { RegisterService } from "./services/register.service";
import { AuthService } from "./services/auth.service";
import { Public } from "../../common/auth/public.decorator";
import { LoginRateLimitService } from "./services/login-rate-limit.service";

interface PassthroughResponse {
  status(code: number): PassthroughResponse;
  setHeader(name: string, value: string): void;
}

@Controller("api/v1/auth")
export class AuthController {
  constructor(
    private readonly registerService: RegisterService,
    private readonly authService: AuthService,
    private readonly loginRateLimit: LoginRateLimitService,
  ) {}

  @Post("login")
  @Public()
  async login(@Body() body: LoginDto, @Ip() ip: string, @Res({ passthrough: true }) response: Response) {
    try {
      await this.loginRateLimit.assertAllowed(body.email, ip);
      const result = await this.authService.login(body.email, body.password, body.otp);
      await this.loginRateLimit.clear(body.email, ip);
      this.setRefreshCookie(response, result.refreshToken);
      return { accessToken: result.accessToken, expiresIn: result.expiresIn, user: result.user };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        await this.loginRateLimit.recordFailure(body.email, ip);
      }
      if (error instanceof RateLimitExceededException) {
        response.setHeader("Retry-After", String(error.retryAfterSeconds));
      }
      throw error;
    }
  }

  @Post("refresh")
  @Public()
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.refresh(this.readRefreshToken(request));
    this.setRefreshCookie(response, result.refreshToken);
    return { accessToken: result.accessToken, expiresIn: result.expiresIn, user: result.user };
  }

  @Post("logout")
  @Public()
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = this.readRefreshToken(request);
    response.clearCookie("topscholar_refresh", this.refreshCookieOptions());
    return this.authService.logout(refreshToken);
  }

  private setRefreshCookie(response: Response, token: string) {
    response.cookie("topscholar_refresh", token, {
      ...this.refreshCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private refreshCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };
  }

  private readRefreshToken(request: Request) {
    const parsed = request.cookies?.topscholar_refresh as string | undefined;
    if (parsed) return parsed;

    const entry = request.headers.cookie
      ?.split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("topscholar_refresh="));

    return entry ? decodeURIComponent(entry.slice("topscholar_refresh=".length)) : undefined;
  }

  @Post("register")
  @Public()
  async register(
    @Body() body: unknown,
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string | undefined,
    @Res({ passthrough: true }) response: PassthroughResponse,
  ) {
    try {
      const result = await this.registerService.register(body, {
        ip,
        userAgent,
      });

      response.status(result.statusCode);
      response.setHeader("X-RateLimit-Remaining", result.headers.rateLimitRemaining.toString());

      return result.body;
    } catch (error) {
      if (error instanceof RateLimitExceededException) {
        response.setHeader("Retry-After", error.retryAfterSeconds.toString());
      }

      throw error;
    }
  }
}
