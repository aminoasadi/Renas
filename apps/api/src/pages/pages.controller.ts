import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import {
  createPageSchema,
  updatePageSchema,
  createSectionSchema,
  updateSectionSchema,
  reorderSectionsSchema,
} from "@renas/validation";
import { AuditAction } from "@renas/shared";
import type { User } from "@renas/database";
import { PagesService } from "./pages.service";
import { PreviewService } from "../content/preview.service";
import { SessionAuthGuard } from "../common/guards/session-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuditService } from "../audit/audit.service";

@Controller("pages")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "EDITOR")
export class PagesController {
  constructor(
    private readonly pages: PagesService,
    private readonly preview: PreviewService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list() {
    return this.pages.list();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.pages.getForEditing(id);
  }

  @Post()
  async create(@Body() body: unknown, @CurrentUser() actor: User, @Req() req: Request) {
    const input = createPageSchema.parse(body);
    const page = await this.pages.create(input);
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.CREATE_PAGE,
      entityType: "Page",
      entityId: page.id,
      ipAddress: req.ip,
    });
    return page;
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: User, @Req() req: Request) {
    const input = updatePageSchema.parse(body);
    const page = await this.pages.update(id, input);
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.UPDATE_PAGE,
      entityType: "Page",
      entityId: id,
      ipAddress: req.ip,
    });
    return page;
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() actor: User, @Req() req: Request) {
    await this.pages.deleteDraft(id);
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.DELETE_DRAFT,
      entityType: "Page",
      entityId: id,
      ipAddress: req.ip,
    });
    return { success: true };
  }

  // ---- Sections ---------------------------------------------------

  @Post(":id/sections")
  addSection(@Param("id") pageId: string, @Body() body: unknown) {
    const input = createSectionSchema.parse(body);
    return this.pages.addSection(pageId, input);
  }

  @Patch(":id/sections/:sectionId")
  updateSection(@Param("id") pageId: string, @Param("sectionId") sectionId: string, @Body() body: unknown) {
    const input = updateSectionSchema.parse(body);
    return this.pages.updateSection(pageId, sectionId, input);
  }

  @Delete(":id/sections/:sectionId")
  removeSection(@Param("id") pageId: string, @Param("sectionId") sectionId: string) {
    return this.pages.removeSection(pageId, sectionId);
  }

  @Post(":id/sections/:sectionId/duplicate")
  duplicateSection(@Param("id") pageId: string, @Param("sectionId") sectionId: string) {
    return this.pages.duplicateSection(pageId, sectionId);
  }

  @Post(":id/sections/reorder")
  reorderSections(@Param("id") pageId: string, @Body() body: unknown) {
    const input = reorderSectionsSchema.parse(body);
    return this.pages.reorderSections(pageId, input.orderedIds);
  }

  // ---- Publish / Preview / Revisions -------------------------------

  @Post(":id/publish")
  async publish(@Param("id") id: string, @CurrentUser() actor: User, @Req() req: Request) {
    const page = await this.pages.publish(id, actor.id);
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.PUBLISH_PAGE,
      entityType: "Page",
      entityId: id,
      ipAddress: req.ip,
    });
    return page;
  }

  @Post(":id/unpublish")
  async unpublish(@Param("id") id: string, @CurrentUser() actor: User, @Req() req: Request) {
    const page = await this.pages.unpublish(id);
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.UNPUBLISH_PAGE,
      entityType: "Page",
      entityId: id,
      ipAddress: req.ip,
    });
    return page;
  }

  @Get(":id/preview-url")
  async previewUrl(@Param("id") id: string) {
    const page = await this.pages.getForEditing(id);
    return { url: this.preview.buildPreviewUrl("page", page.slug) };
  }

  @Get(":id/revisions")
  listRevisions(@Param("id") id: string) {
    return this.pages.listRevisions(id);
  }

  @Post(":id/revisions/:version/restore")
  async restore(
    @Param("id") id: string,
    @Param("version") version: string,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    const page = await this.pages.restoreRevision(id, Number(version));
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.RESTORE_REVISION,
      entityType: "Page",
      entityId: id,
      metadata: { version: Number(version) },
      ipAddress: req.ip,
    });
    return page;
  }
}
