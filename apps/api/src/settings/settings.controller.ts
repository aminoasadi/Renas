import { Body, Controller, Get, Put, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { updateSiteSettingsSchema } from "@renas/validation";
import { AuditAction } from "@renas/shared";
import type { User } from "@renas/database";
import { SettingsService } from "./settings.service";
import { SessionAuthGuard } from "../common/guards/session-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuditService } from "../audit/audit.service";

@Controller("settings")
@UseGuards(SessionAuthGuard, RolesGuard)
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  get() {
    return this.settings.get();
  }

  @Put()
  @Roles("SUPER_ADMIN")
  async update(@Body() body: unknown, @CurrentUser() actor: User, @Req() req: Request) {
    const input = updateSiteSettingsSchema.parse(body);
    const settings = await this.settings.update(input);
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.UPDATE_SETTINGS,
      entityType: "SiteSettings",
      entityId: settings.id,
      ipAddress: req.ip,
    });
    return settings;
  }
}
