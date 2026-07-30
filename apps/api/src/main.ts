import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { SystemSettingsService } from "./infrastructure/settings/system-settings.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const settingsService = app.get(SystemSettingsService);
  const configuredOrigins = await settingsService.getOptionalRuntimeValue<string[]>("cors.origins").catch(() => undefined);
  const corsOrigin = configuredOrigins?.length
    ? configuredOrigins
    : (configService.get<string>("app.corsOrigin") ?? "http://localhost:3000,http://localhost:3001")
      .split(",")
      .map((origin) => origin.trim());
  const port = configService.get<number>("app.apiPort") ?? 4000;

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const swaggerConfig = new DocumentBuilder()
    .setTitle("TopScholar API")
    .setDescription("API vận hành nền tảng học bổng TopScholar")
    .setVersion("2.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(port);
}

void bootstrap();
