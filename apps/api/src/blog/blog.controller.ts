import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { createBlogPostSchema, updateBlogPostSchema, paginationSchema } from "@renas/validation";
import { AuditAction } from "@renas/shared";
import type { User } from "@renas/database";
import { BlogService } from "./blog.service";
import { PreviewService } from "../content/preview.service";
import { SessionAuthGuard } from "../common/guards/session-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuditService } from "../audit/audit.service";

@Controller("blog")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "EDITOR")
export class BlogController {
  constructor(
    private readonly blog: BlogService,
    private readonly preview: PreviewService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(@Query() query: Record<string, string>) {
    const { page, perPage } = paginationSchema.parse(query);
    return this.blog.list({ page, perPage, status: query.status });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.blog.getForEditing(id);
  }

  @Post()
  async create(@Body() body: unknown, @CurrentUser() actor: User, @Req() req: Request) {
    const input = createBlogPostSchema.parse(body);
    const post = await this.blog.create(input);
    await this.audit.record({ userId: actor.id, action: AuditAction.CREATE_POST, entityType: "BlogPost", entityId: post.id, ipAddress: req.ip });
    return post;
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: unknown, @CurrentUser() actor: User, @Req() req: Request) {
    const input = updateBlogPostSchema.parse(body);
    const post = await this.blog.update(id, input);
    await this.audit.record({ userId: actor.id, action: AuditAction.UPDATE_POST, entityType: "BlogPost", entityId: id, ipAddress: req.ip });
    return post;
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() actor: User, @Req() req: Request) {
    await this.blog.delete(id);
    await this.audit.record({ userId: actor.id, action: AuditAction.DELETE_DRAFT, entityType: "BlogPost", entityId: id, ipAddress: req.ip });
    return { success: true };
  }

  @Post(":id/duplicate")
  duplicate(@Param("id") id: string) {
    return this.blog.duplicate(id);
  }

  @Post(":id/publish")
  async publish(@Param("id") id: string, @CurrentUser() actor: User, @Req() req: Request) {
    const post = await this.blog.publish(id, actor.id);
    await this.audit.record({ userId: actor.id, action: AuditAction.PUBLISH_POST, entityType: "BlogPost", entityId: id, ipAddress: req.ip });
    return post;
  }

  @Post(":id/unpublish")
  async unpublish(@Param("id") id: string, @CurrentUser() actor: User, @Req() req: Request) {
    const post = await this.blog.unpublish(id);
    await this.audit.record({ userId: actor.id, action: AuditAction.UNPUBLISH_POST, entityType: "BlogPost", entityId: id, ipAddress: req.ip });
    return post;
  }

  @Post(":id/archive")
  archive(@Param("id") id: string) {
    return this.blog.archive(id);
  }

  @Get(":id/preview-url")
  async previewUrl(@Param("id") id: string) {
    const post = await this.blog.getForEditing(id);
    return { url: this.preview.buildPreviewUrl("blog_post", post.slug) };
  }

  @Get(":id/revisions")
  listRevisions(@Param("id") id: string) {
    return this.blog.listRevisions(id);
  }

  @Post(":id/revisions/:version/restore")
  async restore(@Param("id") id: string, @Param("version") version: string, @CurrentUser() actor: User, @Req() req: Request) {
    const post = await this.blog.restoreRevision(id, Number(version));
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.RESTORE_REVISION,
      entityType: "BlogPost",
      entityId: id,
      metadata: { version: Number(version) },
      ipAddress: req.ip,
    });
    return post;
  }
}
