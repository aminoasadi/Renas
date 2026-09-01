import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { createUserSchema, updateUserSchema, resetPasswordSchema } from "@renas/validation";
import { AuditAction } from "@renas/shared";
import type { User } from "@renas/database";
import { UsersService } from "./users.service";
import { SessionAuthGuard } from "../common/guards/session-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { SessionService } from "../auth/session.service";
import { AuditService } from "../audit/audit.service";

@Controller("users")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN")
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly sessionService: SessionService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Post()
  async create(@Body() body: unknown, @CurrentUser() actor: User, @Req() req: Request) {
    const input = createUserSchema.parse(body);
    const user = await this.users.create(input);
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.CREATE_USER,
      entityType: "User",
      entityId: user.id,
      ipAddress: req.ip,
    });
    return user;
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: User, @Req() req: Request) {
    const input = updateUserSchema.parse(body);
    const user = await this.users.update(id, input);
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.UPDATE_USER,
      entityType: "User",
      entityId: user.id,
      ipAddress: req.ip,
    });
    return user;
  }

  @Patch(":id/disable")
  async disable(@Param("id") id: string, @CurrentUser() actor: User, @Req() req: Request) {
    const user = await this.users.setStatus(id, "DISABLED");
    await this.sessionService.revokeAllSessionsForUser(id);
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.DISABLE_USER,
      entityType: "User",
      entityId: id,
      ipAddress: req.ip,
    });
    return user;
  }

  @Patch(":id/enable")
  async enable(@Param("id") id: string, @CurrentUser() actor: User, @Req() req: Request) {
    const user = await this.users.setStatus(id, "ACTIVE");
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.ENABLE_USER,
      entityType: "User",
      entityId: id,
      ipAddress: req.ip,
    });
    return user;
  }

  @Patch(":id/reset-password")
  async resetPassword(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: User, @Req() req: Request) {
    const input = resetPasswordSchema.parse(body);
    const user = await this.users.resetPassword(id, input.password);
    await this.sessionService.revokeAllSessionsForUser(id);
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.RESET_PASSWORD,
      entityType: "User",
      entityId: id,
      ipAddress: req.ip,
    });
    return user;
  }
}
