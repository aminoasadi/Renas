import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { ScheduleModule } from "@nestjs/schedule";

import { ConfigModule } from "./config/config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { EmailModule } from "./email/email.module";
import { AuditModule } from "./audit/audit.module";
import { ContentModule } from "./content/content.module";

import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { PagesModule } from "./pages/pages.module";
import { NavigationModule } from "./navigation/navigation.module";
import { SettingsModule } from "./settings/settings.module";
import { PublicModule } from "./public/public.module";
import { MediaModule } from "./media/media.module";
import { BlogModule } from "./blog/blog.module";
import { RedirectsModule } from "./redirects/redirects.module";
import { SupplyRequestsModule } from "./supply-requests/supply-requests.module";
import { ContactModule } from "./contact/contact.module";
import { AuditLogsModule } from "./audit-logs/audit-logs.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.APP_ENV === "production" ? "info" : "debug",
        redact: ["req.headers.cookie", "req.headers.authorization"],
        autoLogging: true,
        serializers: {
          req(req) {
            return { id: req.id, method: req.method, url: req.url };
          },
        },
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    EmailModule,
    AuditModule,
    ContentModule,
    AuthModule,
    UsersModule,
    PagesModule,
    NavigationModule,
    SettingsModule,
    PublicModule,
    MediaModule,
    BlogModule,
    RedirectsModule,
    SupplyRequestsModule,
    ContactModule,
    AuditLogsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
