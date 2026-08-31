import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  CreatePageInput,
  UpdatePageInput,
  CreateSectionInput,
  UpdateSectionInput,
} from "@renas/validation";
import { validateSectionContent, type SectionType } from "@renas/validation";
import { revalidationTags } from "@renas/shared";
import { PrismaService } from "../prisma/prisma.service";
import { RevisionsService } from "../content/revisions.service";
import { RevalidationService } from "../content/revalidation.service";

interface PageSnapshot {
  title: string;
  slug: string;
  locale: string;
  seo: Record<string, unknown> | null;
  sections: Array<{
    type: string;
    position: number;
    content: unknown;
    isVisible: boolean;
  }>;
}

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revisions: RevisionsService,
    private readonly revalidation: RevalidationService,
  ) {}

  list() {
    return this.prisma.page.findMany({
      orderBy: { updatedAt: "desc" },
      include: { seoMetadata: true },
    });
  }

  /** For the public sitemap — published pages only, minimal fields. */
  listPublishedSlugs() {
    return this.prisma.page.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, locale: true, updatedAt: true },
    });
  }

  async getForEditing(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { sections: { orderBy: { position: "asc" } }, seoMetadata: true },
    });
    if (!page) throw new NotFoundException("Page not found");
    return page;
  }

  async getDraftBySlug(slug: string, locale = "en") {
    const page = await this.prisma.page.findUnique({
      where: { slug_locale: { slug, locale } },
      include: { sections: { orderBy: { position: "asc" }, where: { isVisible: true } }, seoMetadata: true },
    });
    if (!page) throw new NotFoundException("Page not found");
    return page;
  }

  /** Public: only ever reads the immutable published snapshot, never live draft rows. */
  async getPublishedBySlug(slug: string, locale = "en") {
    const page = await this.prisma.page.findUnique({
      where: { slug_locale: { slug, locale } },
    });
    if (!page || page.status !== "PUBLISHED" || !page.publishedSnapshot) {
      throw new NotFoundException("Page not found");
    }
    return { ...(page.publishedSnapshot as unknown as PageSnapshot), id: page.id, publishedAt: page.publishedAt };
  }

  async create(input: CreatePageInput) {
    const existing = await this.prisma.page.findUnique({
      where: { slug_locale: { slug: input.slug, locale: input.locale } },
    });
    if (existing) throw new ConflictException("A page with this slug already exists for this locale");

    return this.prisma.page.create({
      data: {
        title: input.title,
        slug: input.slug,
        locale: input.locale,
      },
      include: { sections: true, seoMetadata: true },
    });
  }

  async update(id: string, input: UpdatePageInput) {
    const page = await this.prisma.page.findUnique({ where: { id }, include: { seoMetadata: true } });
    if (!page) throw new NotFoundException("Page not found");

    if (input.slug && input.slug !== page.slug) {
      const clash = await this.prisma.page.findUnique({
        where: { slug_locale: { slug: input.slug, locale: page.locale } },
      });
      if (clash) throw new ConflictException("A page with this slug already exists for this locale");

      if (input.createRedirectOnSlugChange !== false && page.status === "PUBLISHED") {
        await this.prisma.redirect.upsert({
          where: { sourcePath: `/${page.slug}` },
          create: {
            sourcePath: `/${page.slug}`,
            destinationPath: `/${input.slug}`,
            statusCode: 301,
          },
          update: { destinationPath: `/${input.slug}`, isActive: true },
        });
      }
    }

    const seoData = input.seo
      ? {
          seoMetadata: {
            upsert: {
              create: input.seo,
              update: input.seo,
            },
          },
        }
      : {};

    return this.prisma.page.update({
      where: { id },
      data: {
        title: input.title,
        slug: input.slug,
        ...seoData,
      },
      include: { sections: { orderBy: { position: "asc" } }, seoMetadata: true },
    });
  }

  async deleteDraft(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException("Page not found");
    if (page.status === "PUBLISHED") {
      throw new BadRequestException("Unpublish this page before deleting it");
    }
    await this.prisma.page.delete({ where: { id } });
  }

  // ---- Sections -------------------------------------------------------

  async addSection(pageId: string, input: CreateSectionInput) {
    const validatedContent = validateSectionContent(input.type as SectionType, input.content);
    const count = await this.prisma.pageSection.count({ where: { pageId } });
    const position = input.position ?? count;

    if (position < count) {
      await this.prisma.pageSection.updateMany({
        where: { pageId, position: { gte: position } },
        data: { position: { increment: 1 } },
      });
    }

    const created = await this.prisma.pageSection.create({
      data: {
        pageId,
        type: input.type,
        position,
        content: validatedContent as never,
        isVisible: input.isVisible,
      },
    });
    await this.touchPage(pageId);
    return created;
  }

  async updateSection(pageId: string, sectionId: string, input: UpdateSectionInput) {
    const section = await this.prisma.pageSection.findFirst({ where: { id: sectionId, pageId } });
    if (!section) throw new NotFoundException("Section not found");

    const content =
      input.content !== undefined
        ? validateSectionContent(section.type as SectionType, input.content)
        : undefined;

    const updated = await this.prisma.pageSection.update({
      where: { id: sectionId },
      data: {
        content: content as never,
        isVisible: input.isVisible,
      },
    });
    await this.touchPage(pageId);
    return updated;
  }

  async removeSection(pageId: string, sectionId: string) {
    const section = await this.prisma.pageSection.findFirst({ where: { id: sectionId, pageId } });
    if (!section) throw new NotFoundException("Section not found");

    await this.prisma.$transaction([
      this.prisma.pageSection.delete({ where: { id: sectionId } }),
      this.prisma.pageSection.updateMany({
        where: { pageId, position: { gt: section.position } },
        data: { position: { decrement: 1 } },
      }),
    ]);
    await this.touchPage(pageId);
  }

  async duplicateSection(pageId: string, sectionId: string) {
    const section = await this.prisma.pageSection.findFirst({ where: { id: sectionId, pageId } });
    if (!section) throw new NotFoundException("Section not found");

    await this.prisma.pageSection.updateMany({
      where: { pageId, position: { gt: section.position } },
      data: { position: { increment: 1 } },
    });

    const created = await this.prisma.pageSection.create({
      data: {
        pageId,
        type: section.type,
        position: section.position + 1,
        content: section.content as never,
        isVisible: section.isVisible,
      },
    });
    await this.touchPage(pageId);
    return created;
  }

  /** Bumps Page.updatedAt whenever a child section changes, since Prisma's @updatedAt only fires on direct updates to the Page row itself — this is what lets the admin UI detect "unpublished changes" by comparing updatedAt to publishedAt. */
  private async touchPage(pageId: string): Promise<void> {
    await this.prisma.page.update({ where: { id: pageId }, data: {} });
  }

  async reorderSections(pageId: string, orderedIds: string[]) {
    const sections = await this.prisma.pageSection.findMany({ where: { pageId } });
    if (sections.length !== orderedIds.length || !sections.every((s) => orderedIds.includes(s.id))) {
      throw new BadRequestException("orderedIds must include exactly the page's current sections");
    }

    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.pageSection.update({ where: { id }, data: { position: index } }),
      ),
    );
    await this.touchPage(pageId);

    return this.prisma.pageSection.findMany({ where: { pageId }, orderBy: { position: "asc" } });
  }

  // ---- Publish / Preview / Revisions -----------------------------------

  async buildSnapshot(pageId: string): Promise<PageSnapshot> {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: { sections: { orderBy: { position: "asc" } }, seoMetadata: true },
    });
    if (!page) throw new NotFoundException("Page not found");

    return {
      title: page.title,
      slug: page.slug,
      locale: page.locale,
      seo: page.seoMetadata
        ? {
            seoTitle: page.seoMetadata.seoTitle,
            seoDescription: page.seoMetadata.seoDescription,
            canonicalUrl: page.seoMetadata.canonicalUrl,
            robotsIndex: page.seoMetadata.robotsIndex,
            robotsFollow: page.seoMetadata.robotsFollow,
            ogTitle: page.seoMetadata.ogTitle,
            ogDescription: page.seoMetadata.ogDescription,
            ogImageId: page.seoMetadata.ogImageId,
          }
        : null,
      sections: page.sections
        .filter((s) => s.isVisible)
        .map((s) => ({ type: s.type, position: s.position, content: s.content, isVisible: s.isVisible })),
    };
  }

  async publish(pageId: string, editorId: string) {
    const snapshot = await this.buildSnapshot(pageId);

    const [, page] = await this.prisma.$transaction([
      this.prisma.contentRevision.create({
        data: {
          entityType: "PAGE",
          entityId: pageId,
          version: await this.nextVersion(pageId),
          snapshot: snapshot as never,
          editorId,
        },
      }),
      this.prisma.page.update({
        where: { id: pageId },
        data: { status: "PUBLISHED", publishedAt: new Date(), publishedSnapshot: snapshot as never },
      }),
    ]);

    await this.revalidation.revalidateTags([revalidationTags.page(page.slug), revalidationTags.navigation()]);
    return page;
  }

  async unpublish(pageId: string) {
    const page = await this.prisma.page.update({ where: { id: pageId }, data: { status: "DRAFT" } });
    await this.revalidation.revalidateTags([revalidationTags.page(page.slug)]);
    return page;
  }

  private async nextVersion(pageId: string): Promise<number> {
    const latest = await this.prisma.contentRevision.findFirst({
      where: { entityType: "PAGE", entityId: pageId },
      orderBy: { version: "desc" },
    });
    return (latest?.version ?? 0) + 1;
  }

  listRevisions(pageId: string) {
    return this.revisions.listRevisions("PAGE", pageId);
  }

  async restoreRevision(pageId: string, version: number) {
    const revision = await this.revisions.getRevision("PAGE", pageId, version);
    if (!revision) throw new NotFoundException("Revision not found");

    const snapshot = revision.snapshot as unknown as PageSnapshot;

    await this.prisma.$transaction([
      this.prisma.pageSection.deleteMany({ where: { pageId } }),
      this.prisma.pageSection.createMany({
        data: snapshot.sections.map((s) => ({
          pageId,
          type: s.type as never,
          position: s.position,
          content: s.content as never,
          isVisible: s.isVisible,
        })),
      }),
      this.prisma.page.update({ where: { id: pageId }, data: { title: snapshot.title } }),
    ]);

    return this.getForEditing(pageId);
  }
}
