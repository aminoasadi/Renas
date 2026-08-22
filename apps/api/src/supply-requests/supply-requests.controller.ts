import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import {
  supplyRequestSchema,
  updateSupplyRequestStatusSchema,
  addSupplyRequestNoteSchema,
  paginationSchema,
} from "@renas/validation";
import { AuditAction } from "@renas/shared";
import type { User } from "@renas/database";
import { SupplyRequestsService } from "./supply-requests.service";
import { MediaService } from "../media/media.service";
import { SessionAuthGuard } from "../common/guards/session-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuditService } from "../audit/audit.service";

@Controller("public/supply-requests")
export class PublicSupplyRequestsController {
  constructor(
    private readonly supplyRequests: SupplyRequestsService,
    private readonly media: MediaService,
  ) {}

  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  submit(@Body() body: unknown) {
    const input = supplyRequestSchema.parse(body);
    return this.supplyRequests.submit(input);
  }

  /**
   * A deliberately narrow, unauthenticated upload path — an RFQ attachment
   * has to be uploadable by a visitor who has never logged into the CMS.
   * It reuses the same MIME-sniffing/size-limit validation as the admin
   * media library (see MediaService), just without requiring a session,
   * and is rate-limited far more tightly than a normal form submission
   * since it accepts arbitrary binary payloads from anonymous callers.
   */
  @Post("attachment")
  @HttpCode(201)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor("file"))
  async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    const asset = await this.media.upload({
      originalFilename: file.originalname,
      buffer: file.buffer,
      uploadedById: null,
    });
    return { id: asset.id, publicUrl: asset.publicUrl };
  }
}

@Controller("supply-requests")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "EDITOR")
export class SupplyRequestsController {
  constructor(
    private readonly supplyRequests: SupplyRequestsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(@Query() query: Record<string, string>) {
    const { page, perPage } = paginationSchema.parse(query);
    return this.supplyRequests.list({ page, perPage, status: query.status, search: query.search });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.supplyRequests.get(id);
  }

  @Patch(":id/status")
  async updateStatus(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: User, @Req() req: Request) {
    const input = updateSupplyRequestStatusSchema.parse(body);
    const request = await this.supplyRequests.updateStatus(id, input.status);
    await this.audit.record({ userId: actor.id, action: AuditAction.UPDATE_SUPPLY_REQUEST, entityType: "SupplyRequest", entityId: id, metadata: { status: input.status }, ipAddress: req.ip });
    return request;
  }

  @Post(":id/notes")
  addNote(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: User) {
    const input = addSupplyRequestNoteSchema.parse(body);
    return this.supplyRequests.addNote(id, actor.id, input.note);
  }
}
