import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";

@Injectable()
export class PasswordHashService {
  constructor(private readonly configService: ConfigService) {}

  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.configService.get<number>("argon2.memoryCost") ?? 19456,
      timeCost: this.configService.get<number>("argon2.timeCost") ?? 2,
      parallelism: this.configService.get<number>("argon2.parallelism") ?? 1,
    });
  }

  async verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
