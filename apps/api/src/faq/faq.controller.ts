import { Body, Controller, Get, Put, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { updateFaqItemsSchema } from "@renas/validation";
import { AuditAction } from "@renas/shared";
import type { User } from "@renas/database";
import { FaqService } from "./faq.service";
import { SessionAuthGuard } from "../common/guards/session-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuditService } from "../audit/audit.service";

@Controller("faq")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "EDITOR")
export class FaqController {
  constructor(
    private readonly faq: FaqService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(@Query("locale") locale = "en") {
    return this.faq.list(locale);
  }

  @Put()
  async update(@Query("locale") locale: string = "en", @Body() body: unknown, @CurrentUser() actor: User, @Req() req: Request) {
    const input = updateFaqItemsSchema.parse(body);
    const items = await this.faq.replaceAll(locale, input);
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.UPDATE_FAQ_ITEMS,
      entityType: "FaqItem",
      entityId: locale,
      ipAddress: req.ip,
    });
    return items;
  }
}
