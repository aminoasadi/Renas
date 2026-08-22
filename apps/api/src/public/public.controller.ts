import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { paginationSchema } from "@renas/validation";
import { PagesService } from "../pages/pages.service";
import { NavigationService } from "../navigation/navigation.service";
import { SettingsService } from "../settings/settings.service";
import { BlogService } from "../blog/blog.service";
import { InternalSecretGuard } from "../common/guards/internal-secret.guard";

/**
 * Everything under /public/* is safe to expose without authentication — it
 * only ever reads PUBLISHED content. Draft content lives under /internal/*
 * and is guarded so only the web app's own server (during preview) can
 * reach it — see `content/preview.service.ts` and
 * `common/guards/internal-secret.guard.ts`.
 */
@Controller("public")
export class PublicController {
  constructor(
    private readonly pages: PagesService,
    private readonly navigation: NavigationService,
    private readonly settings: SettingsService,
    private readonly blog: BlogService,
  ) {}

  @Get("pages/:slug")
  getPage(@Param("slug") slug: string, @Query("locale") locale?: string) {
    return this.pages.getPublishedBySlug(slug, locale);
  }

  @Get("navigation/:key")
  async getNavigation(@Param("key") key: "HEADER" | "FOOTER") {
    const nav = await this.navigation.get(key);
    return { ...nav, items: nav.items.filter((item) => item.isVisible) };
  }

  @Get("settings")
  getSettings() {
    return this.settings.get();
  }

  @Get("blog")
  listBlog(@Query() query: Record<string, string>) {
    const { page, perPage } = paginationSchema.parse(query);
    return this.blog.listPublished({ page, perPage, category: query.category, tag: query.tag, search: query.search });
  }

  @Get("blog/:slug")
  getBlogPost(@Param("slug") slug: string) {
    return this.blog.getPublishedBySlug(slug);
  }

  @Get("sitemap")
  async getSitemap() {
    const [pages, posts] = await Promise.all([this.pages.listPublishedSlugs(), this.blog.listPublishedSlugs()]);
    return { pages, posts };
  }
}

@Controller("internal")
@UseGuards(InternalSecretGuard)
export class InternalController {
  constructor(
    private readonly pages: PagesService,
    private readonly blog: BlogService,
  ) {}

  /** Used only by the Next.js server while rendering an active preview session. */
  @Get("pages/:slug/draft")
  getDraftPage(@Param("slug") slug: string, @Query("locale") locale?: string) {
    return this.pages.getDraftBySlug(slug, locale);
  }

  @Get("blog/:slug/draft")
  getDraftBlogPost(@Param("slug") slug: string) {
    return this.blog.getDraftBySlug(slug);
  }
}
