import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SystemSettingsService } from "./system-settings.service";

describe("SystemSettingsService", () => {
  const rows = new Map<string, { key: string; value: string; updatedAt: Date }>();
  const systemSetting = {
    findMany: jest.fn(async ({ where }: { where: { key: { in: string[] } } }) =>
      where.key.in.flatMap((key) => {
        const row = rows.get(key);
        return row ? [row] : [];
      })),
    findUnique: jest.fn(async ({ where }: { where: { key: string } }) => rows.get(where.key) ?? null),
    upsert: jest.fn(({ where, create, update }: {
      where: { key: string };
      create: { key: string; value: string };
      update: { value: string };
    }) => Promise.resolve().then(() => {
      const row = {
        key: where.key,
        value: rows.has(where.key) ? update.value : create.value,
        updatedAt: new Date(),
      };
      rows.set(where.key, row);
      return row;
    })),
    deleteMany: jest.fn(({ where }: { where: { key: string } }) => Promise.resolve().then(() => {
      const deleted = rows.delete(where.key);
      return { count: deleted ? 1 : 0 };
    })),
  };
  const prisma = {
    client: {
      systemSetting,
      $transaction: jest.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations)),
    },
  };
  const config = {
    get: jest.fn((key: string) => key === "settings.encryptionKey" ? "test-settings-encryption-key" : undefined),
  };
  const service = new SystemSettingsService(
    prisma as never,
    config as unknown as ConfigService,
  );

  beforeEach(() => {
    rows.clear();
    jest.clearAllMocks();
  });

  it("returns typed defaults for one group", async () => {
    const result = await service.getAdminSettings("general");
    expect(result.values["site.name"]).toBe("TopScholar");
    expect(result.values["theme.primaryColor"]).toBe("#0866FF");
    expect(result.values["registration.enabled"]).toBeUndefined();
  });

  it("rejects unknown keys and invalid typed values", async () => {
    await expect(service.updateAdminSettings({
      "unknown.setting": true,
      "theme.primaryColor": "blue",
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("stores normal values as JSON", async () => {
    await service.updateAdminSettings({
      "site.name": "TopScholar Vietnam",
      "theme.borderRadiusPx": 16,
    });
    expect(rows.get("site.name")?.value).toBe("\"TopScholar Vietnam\"");
    expect(await service.getRuntimeValue<string>("site.name")).toBe("TopScholar Vietnam");
  });

  it("encrypts secrets at rest and never returns them to admin", async () => {
    await service.updateAdminSettings({ "mail.password": "smtp-secret" });
    const stored = rows.get("mail.password")?.value ?? "";
    expect(stored).toMatch(/^enc:v1:/);
    expect(stored).not.toContain("smtp-secret");
    expect(await service.getRuntimeValue<string>("mail.password")).toBe("smtp-secret");
    const admin = await service.getAdminSettings("notifications");
    expect(admin.values["mail.password"]).toBe("");
    expect(admin.secretConfigured["mail.password"]).toBe(true);
  });

  it("clears only catalogued secret keys", async () => {
    await service.updateAdminSettings({ "mail.password": "smtp-secret" });
    await service.updateAdminSettings({}, ["mail.password"]);
    expect(rows.has("mail.password")).toBe(false);
    await expect(service.updateAdminSettings({}, ["site.name"])).rejects.toBeInstanceOf(BadRequestException);
  });
});
