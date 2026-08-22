import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { paginationSchema } from "@renas/validation";
import { AuditAction } from "@renas/shared";
import type { User } from "@renas/database";
import { MediaService } from "./media.service";
import { SessionAuthGuard } from "../common/guards/session-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuditService } from "../audit/audit.service";

@Controller("media")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "EDITOR")
export class MediaController {
  constructor(
    private readonly media: MediaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(@Query() query: Record<string, string>) {
    const { page, perPage } = paginationSchema.parse(query);
    return this.media.list({ page, perPage, search: query.search });
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    const asset = await this.media.upload({
      originalFilename: file.originalname,
      buffer: file.buffer,
      uploadedById: actor.id,
    });
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.UPLOAD_MEDIA,
      entityType: "MediaAsset",
      entityId: asset.id,
      ipAddress: req.ip,
    });
    return asset;
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: { alt?: string; caption?: string }) {
    return this.media.updateMetadata(id, body);
  }

  @Get(":id/references")
  checkReferences(@Param("id") id: string) {
    return this.media.checkReferences(id).then((references) => ({ references }));
  }

  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @Query("force") force: string,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    await this.media.delete(id, force === "true");
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.DELETE_MEDIA,
      entityType: "MediaAsset",
      entityId: id,
      ipAddress: req.ip,
    });
    return { success: true };
  }
}
