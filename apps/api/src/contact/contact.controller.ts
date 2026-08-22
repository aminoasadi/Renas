import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { contactSubmissionSchema, updateContactSubmissionStatusSchema, paginationSchema } from "@renas/validation";
import { AuditAction } from "@renas/shared";
import type { User } from "@renas/database";
import { ContactService } from "./contact.service";
import { SessionAuthGuard } from "../common/guards/session-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuditService } from "../audit/audit.service";

@Controller("public/contact-submissions")
export class PublicContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  submit(@Body() body: unknown) {
    const input = contactSubmissionSchema.parse(body);
    return this.contact.submit(input);
  }
}

@Controller("contact-submissions")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "EDITOR")
export class ContactController {
  constructor(
    private readonly contact: ContactService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(@Query() query: Record<string, string>) {
    const { page, perPage } = paginationSchema.parse(query);
    return this.contact.list({ page, perPage, status: query.status });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.contact.get(id);
  }

  @Patch(":id/status")
  async updateStatus(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: User, @Req() req: Request) {
    const input = updateContactSubmissionStatusSchema.parse(body);
    const submission = await this.contact.updateStatus(id, input.status);
    await this.audit.record({ userId: actor.id, action: AuditAction.UPDATE_CONTACT_SUBMISSION, entityType: "ContactSubmission", entityId: id, metadata: { status: input.status }, ipAddress: req.ip });
    return submission;
  }
}
