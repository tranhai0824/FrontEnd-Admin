import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac } from "node:crypto";

@Injectable()
export class SecurityHashService {
  private readonly auditHmacSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.auditHmacSecret = this.getRequiredSecret("security.auditHmacSecret");
  }

  hashIdentifier(value: string): string {
    return createHmac("sha256", this.auditHmacSecret).update(value).digest("hex");
  }

  private getRequiredSecret(path: string): string {
    const value = this.configService.get<string>(path);

    if (!value) {
      throw new Error(`${path} is required`);
    }

    return value;
  }
}
