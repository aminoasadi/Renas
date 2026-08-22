import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { createRedirectSchema } from "@renas/validation";
import { AuditAction } from "@renas/shared";
import type { User } from "@renas/database";
import { RedirectsService } from "./redirects.service";
import { SessionAuthGuard } from "../common/guards/session-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuditService } from "../audit/audit.service";

@Controller("redirects")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN")
export class RedirectsController {
  constructor(
    private readonly redirects: RedirectsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list() {
    return this.redirects.list();
  }

  @Post()
  async create(@Body() body: unknown, @CurrentUser() actor: User, @Req() req: Request) {
    const input = createRedirectSchema.parse(body);
    const redirect = await this.redirects.create(input);
    await this.audit.record({ userId: actor.id, action: AuditAction.CREATE_REDIRECT, entityType: "Redirect", entityId: redirect.id, ipAddress: req.ip });
    return redirect;
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: Partial<ReturnType<typeof createRedirectSchema.parse>>, @CurrentUser() actor: User, @Req() req: Request) {
    const redirect = await this.redirects.update(id, body);
    await this.audit.record({ userId: actor.id, action: AuditAction.UPDATE_REDIRECT, entityType: "Redirect", entityId: id, ipAddress: req.ip });
    return redirect;
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() actor: User, @Req() req: Request) {
    await this.redirects.delete(id);
    await this.audit.record({ userId: actor.id, action: AuditAction.DELETE_REDIRECT, entityType: "Redirect", entityId: id, ipAddress: req.ip });
    return { success: true };
  }
}

/** Public: resolves a single redirect hop for the web app's middleware. */
@Controller("public/redirects")
export class PublicRedirectsController {
  constructor(private readonly redirects: RedirectsService) {}

  @Get("resolve")
  resolve(@Req() req: Request) {
    const path = String(req.query.path ?? "");
    return this.redirects.resolve(path);
  }
}
