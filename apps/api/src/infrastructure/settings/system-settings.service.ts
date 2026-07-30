import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  getSystemSettingDefaults,
  getSystemSettingDefinition,
  getSystemSettingDefinitions,
  type SystemSettingGroup,
  type SystemSettingValue,
  validateSystemSettingValue,
} from "@scholarship/shared";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";

const ENCRYPTED_PREFIX = "enc:v1:";

@Injectable()
export class SystemSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getAdminSettings(group?: SystemSettingGroup) {
    const definitions = getSystemSettingDefinitions(group);
    const rows = await this.prisma.client.systemSetting.findMany({
      where: { key: { in: definitions.map((definition) => definition.key) } },
      orderBy: { key: "asc" },
    });
    const rowByKey = new Map(rows.map((row) => [row.key, row]));
    const values = getSystemSettingDefaults(group);
    const secretConfigured: Record<string, boolean> = {};
    const updatedAt: Record<string, string | null> = {};

    for (const definition of definitions) {
      const row = rowByKey.get(definition.key);
      updatedAt[definition.key] = row?.updatedAt.toISOString() ?? null;

      if (definition.secret) {
        secretConfigured[definition.key] = Boolean(row?.value);
        values[definition.key] = "";
        continue;
      }

      if (row) values[definition.key] = this.parseStoredValue(row.value, definition.defaultValue);
    }

    return { values, secretConfigured, updatedAt };
  }

  async updateAdminSettings(
    values: Record<string, unknown>,
    clearSecrets: readonly string[] = [],
  ) {
    const errors: Record<string, string> = {};
    const normalized: Array<{ key: string; serialized: string }> = [];

    for (const [key, value] of Object.entries(values)) {
      const definition = getSystemSettingDefinition(key);
      if (!definition) {
        errors[key] = "Key cấu hình không được hỗ trợ";
        continue;
      }

      if (definition.secret && value === "") continue;
      const error = validateSystemSettingValue(definition, value);
      if (error) {
        errors[key] = error;
        continue;
      }

      normalized.push({
        key,
        serialized: definition.secret
          ? this.encryptSecret(String(value))
          : JSON.stringify(value),
      });
    }

    for (const key of clearSecrets) {
      const definition = getSystemSettingDefinition(key);
      if (!definition?.secret) errors[key] = "Không phải key bí mật";
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        code: "INVALID_SYSTEM_SETTINGS",
        message: "Một số cấu hình không hợp lệ.",
        errors,
      });
    }

    await this.prisma.client.$transaction([
      ...normalized.map(({ key, serialized }) => this.prisma.client.systemSetting.upsert({
        where: { key },
        create: { key, value: serialized },
        update: { value: serialized },
      })),
      ...clearSecrets.map((key) => this.prisma.client.systemSetting.deleteMany({ where: { key } })),
    ]);

    return {
      changedKeys: normalized.map((item) => item.key),
      clearedSecretKeys: [...clearSecrets],
    };
  }

  async getRuntimeValue<T extends SystemSettingValue>(key: string): Promise<T> {
    const definition = getSystemSettingDefinition(key);
    if (!definition) throw new Error(`Unknown system setting: ${key}`);
    const row = await this.prisma.client.systemSetting.findUnique({ where: { key } });
    if (!row) return definition.defaultValue as T;
    if (definition.secret) return this.decryptSecret(row.value) as T;
    return this.parseStoredValue(row.value, definition.defaultValue) as T;
  }

  async getOptionalRuntimeValue<T extends SystemSettingValue>(key: string): Promise<T | undefined> {
    const definition = getSystemSettingDefinition(key);
    if (!definition) throw new Error(`Unknown system setting: ${key}`);
    const row = await this.prisma.client.systemSetting.findUnique({ where: { key } });
    if (!row) return undefined;
    if (definition.secret) return this.decryptSecret(row.value) as T;
    return this.parseStoredValue(row.value, definition.defaultValue) as T;
  }

  private parseStoredValue(serialized: string, fallback: SystemSettingValue): SystemSettingValue {
    try {
      return JSON.parse(serialized) as SystemSettingValue;
    } catch {
      return fallback;
    }
  }

  private encryptionKey() {
    const nodeEnv = this.config.get<string>("app.nodeEnv") ?? "development";
    const material = this.config.get<string>("settings.encryptionKey")
      ?? (nodeEnv === "production" ? undefined : this.config.get<string>("security.auditHmacSecret"));
    if (!material) {
      throw new ServiceUnavailableException(
        "SETTINGS_ENCRYPTION_KEY chưa được cấu hình; không thể lưu hoặc đọc secret.",
      );
    }
    return createHash("sha256").update(material).digest();
  }

  private encryptSecret(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${ENCRYPTED_PREFIX}${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
  }

  private decryptSecret(value: string) {
    if (!value.startsWith(ENCRYPTED_PREFIX)) {
      throw new ServiceUnavailableException("Secret cấu hình đang ở định dạng không an toàn.");
    }
    const [ivEncoded, tagEncoded, encryptedEncoded] = value.slice(ENCRYPTED_PREFIX.length).split(":");
    if (!ivEncoded || !tagEncoded || !encryptedEncoded) {
      throw new ServiceUnavailableException("Secret cấu hình bị hỏng.");
    }
    const decipher = createDecipheriv(
      "aes-256-gcm",
      this.encryptionKey(),
      Buffer.from(ivEncoded, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedEncoded, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  }
}
