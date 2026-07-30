import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer";
import { SystemSettingsService } from "../settings/system-settings.service";

@Injectable()
export class MailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly systemSettings: SystemSettingsService,
  ) {}

  async sendMail(options: SendMailOptions) {
    const runtime = await this.runtimeConfiguration();
    const sandbox = runtime.sandboxEnabled && runtime.sandboxRecipient;
    return runtime.transporter.sendMail({
      from: runtime.from,
      replyTo: runtime.replyTo || undefined,
      bcc: runtime.archiveBcc || undefined,
      ...options,
      ...(sandbox ? {
        to: runtime.sandboxRecipient,
        cc: undefined,
        bcc: undefined,
        subject: `[SANDBOX → ${String(options.to ?? "")}] ${String(options.subject ?? "")}`,
      } : {}),
    });
  }

  private async runtimeConfiguration(): Promise<{
    transporter: Transporter;
    from: string;
    replyTo: string;
    archiveBcc: string;
    sandboxEnabled: boolean;
    sandboxRecipient: string;
  }> {
    const [
      hostOverride,
      portOverride,
      secureOverride,
      usernameOverride,
      passwordOverride,
      fromNameOverride,
      fromEmailOverride,
      replyToOverride,
      archiveBccOverride,
      sandboxEnabledOverride,
      sandboxRecipientOverride,
    ] = await Promise.all([
      this.systemSettings.getOptionalRuntimeValue<string>("mail.host"),
      this.systemSettings.getOptionalRuntimeValue<number>("mail.port"),
      this.systemSettings.getOptionalRuntimeValue<boolean>("mail.secure"),
      this.systemSettings.getOptionalRuntimeValue<string>("mail.username"),
      this.systemSettings.getOptionalRuntimeValue<string>("mail.password"),
      this.systemSettings.getOptionalRuntimeValue<string>("mail.fromName"),
      this.systemSettings.getOptionalRuntimeValue<string>("mail.fromEmail"),
      this.systemSettings.getOptionalRuntimeValue<string>("mail.replyTo"),
      this.systemSettings.getOptionalRuntimeValue<string>("mail.archiveBcc"),
      this.systemSettings.getOptionalRuntimeValue<boolean>("mail.sandboxEnabled"),
      this.systemSettings.getOptionalRuntimeValue<string>("mail.sandboxRecipient"),
    ]);
    const username = usernameOverride ?? this.configService.get<string>("mail.user") ?? "";
    const password = passwordOverride ?? this.configService.get<string>("mail.password") ?? "";
    const fromEmail = fromEmailOverride ?? this.configService.get<string>("mail.from") ?? "no-reply@scholarship-platform.local";
    const fromName = fromNameOverride ?? "TopScholar";

    return {
      transporter: nodemailer.createTransport({
        host: hostOverride ?? this.configService.get<string>("mail.host") ?? "localhost",
        port: portOverride ?? this.configService.get<number>("mail.port") ?? 1025,
        secure: secureOverride ?? this.configService.get<boolean>("mail.secure") ?? false,
        auth: username ? { user: username, pass: password } : undefined,
      }),
      from: `${fromName} <${fromEmail}>`,
      replyTo: replyToOverride ?? "",
      archiveBcc: archiveBccOverride ?? "",
      sandboxEnabled: sandboxEnabledOverride ?? false,
      sandboxRecipient: sandboxRecipientOverride ?? "",
    };
  }
}
