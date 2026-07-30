import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/auth/public.decorator";

@Controller()
export class AppController {
  @Get("health")
  @Public()
  getHealth() {
    return {
      status: "ok",
      service: "scholarship-api",
    };
  }
}
