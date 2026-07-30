import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private clientInstance?: Redis;

  constructor(private readonly configService: ConfigService) {}

  get client(): Redis {
    this.clientInstance ??= this.createClient();
    return this.clientInstance;
  }

  onModuleDestroy() {
    this.clientInstance?.disconnect();
  }

  private createClient(): Redis {
    const url = this.configService.get<string>("redis.url");

    if (url) {
      return new Redis(url);
    }

    return new Redis({
      host: this.configService.get<string>("redis.host") ?? "localhost",
      port: this.configService.get<number>("redis.port") ?? 6379,
      password: this.configService.get<string>("redis.password"),
    });
  }
}
