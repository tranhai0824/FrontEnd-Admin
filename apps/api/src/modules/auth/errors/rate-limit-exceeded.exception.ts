import { HttpException, HttpStatus } from "@nestjs/common";

export class RateLimitExceededException extends HttpException {
  constructor(
    readonly retryAfterSeconds: number,
    message = "Too many requests.",
  ) {
    super(
      {
        code: "TOO_MANY_REQUESTS",
        message,
        retryAfterSeconds,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
