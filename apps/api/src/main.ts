import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Logger } from "nestjs-pino";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import type { AppConfig } from "./config/config.service";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get<AppConfig>("APP_CONFIG");

  if (config.appEnv === "production") {
    // Behind nginx, req.ip otherwise reports the proxy's address for every
    // request — which would make OTP/RFQ rate limiting and audit log IPs
    // meaningless (everyone looks like the same client).
    app.set("trust proxy", 1);
  }

  app.use(
    helmet({
      contentSecurityPolicy: config.appEnv === "production" ? undefined : false,
    }),
  );
  app.use(cookieParser());

  app.enableCors({
    origin: [config.webUrl, config.adminUrl],
    credentials: true,
  });

  app.setGlobalPrefix("api/v1");
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  if (config.appEnv !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("RENAS API")
      .setDescription("RENAS Group platform API")
      .setVersion("1.0")
      .addCookieAuth(config.sessionCookieName)
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document);
  }

  const port = Number(process.env.PORT ?? 3002);
  await app.listen(port);
  console.log(`RENAS API listening on port ${port}`);
}

bootstrap();
