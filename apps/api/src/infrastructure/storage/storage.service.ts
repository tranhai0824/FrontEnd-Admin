import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SystemSettingsService } from "../settings/system-settings.service";

@Injectable()
export class StorageService {
  private clientInstance?: S3Client;

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly systemSettings?: SystemSettingsService,
  ) {}

  get client(): S3Client {
    this.clientInstance ??= new S3Client({
      endpoint: this.configService.get<string>("storage.endpoint"),
      region: this.configService.get<string>("storage.region") ?? "us-east-1",
      forcePathStyle: this.configService.get<boolean>("storage.forcePathStyle") ?? true,
      credentials: {
        accessKeyId: this.configService.get<string>("storage.accessKeyId") ?? "",
        secretAccessKey: this.configService.get<string>("storage.secretAccessKey") ?? "",
      },
    });

    return this.clientInstance;
  }

  async uploadObject(key: string, body: Buffer | Uint8Array | string, contentType?: string) {
    const bucket = this.configService.get<string>("storage.bucket");

    if (!bucket) {
      throw new Error("S3_BUCKET is not configured");
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async signedDownloadUrl(key: string, expiresIn?: number) {
    const bucket = this.configService.get<string>("storage.bucket");
    if (!bucket) throw new Error("S3_BUCKET is not configured");
    const configuredTtl = expiresIn
      ?? await this.systemSettings?.getOptionalRuntimeValue<number>("signedUrl.downloadTtlSeconds")
      ?? 300;
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: Math.min(Math.max(configuredTtl, 60), 3600),
    });
  }
}
