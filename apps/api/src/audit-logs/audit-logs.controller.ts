import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { paginationSchema } from "@renas/validation";
import { AuditService } from "../audit/audit.service";
import { SessionAuthGuard } from "../common/guards/session-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { PrismaService } from "../prisma/prisma.service";

@Controller("audit-logs")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN")
export class AuditLogsController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query() query: Record<string, string>) {
    const { page, perPage } = paginationSchema.parse(query);
    return this.audit.list({ page, perPage });
  }
}

/** Real counts from the database — no synthetic/fake analytics. */
@Controller("dashboard")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "EDITOR")
export class DashboardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async summary() {
    const [
      publishedPages,
      draftPages,
      publishedPosts,
      draftPosts,
      newSupplyRequests,
      recentContactSubmissions,
      recentActivity,
    ] = await Promise.all([
      this.prisma.page.count({ where: { status: "PUBLISHED" } }),
      this.prisma.page.count({ where: { status: "DRAFT" } }),
      this.prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
      this.prisma.blogPost.count({ where: { status: "DRAFT" } }),
      this.prisma.supplyRequest.count({ where: { status: "NEW" } }),
      this.prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      this.audit.list({ page: 1, perPage: 10 }),
    ]);

    return {
      publishedPages,
      draftPages,
      publishedPosts,
      draftPosts,
      newSupplyRequests,
      recentContactSubmissions,
      recentActivity: recentActivity.items,
    };
  }
}
