import { Body, Controller, Get, Param, Put, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { updateNavigationSchema } from "@renas/validation";
import { AuditAction } from "@renas/shared";
import type { User } from "@renas/database";
import { NavigationService } from "./navigation.service";
import { SessionAuthGuard } from "../common/guards/session-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuditService } from "../audit/audit.service";

@Controller("navigation")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "EDITOR")
export class NavigationController {
  constructor(
    private readonly navigation: NavigationService,
    private readonly audit: AuditService,
  ) {}

  @Get(":key")
  get(@Param("key") key: "HEADER" | "FOOTER") {
    return this.navigation.get(key);
  }

  @Put(":key")
  async update(
    @Param("key") key: "HEADER" | "FOOTER",
    @Query("locale") locale: string = "en",
    @Body() body: unknown,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    const input = updateNavigationSchema.parse(body);
    const nav = await this.navigation.update(key, locale, input);
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.UPDATE_NAVIGATION,
      entityType: "Navigation",
      entityId: nav.id,
      ipAddress: req.ip,
    });
    return nav;
  }
}
