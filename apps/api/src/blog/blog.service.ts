import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateBlogPostInput, UpdateBlogPostInput } from "@renas/validation";
import { revalidationTags } from "@renas/shared";
import { PrismaService } from "../prisma/prisma.service";
import { RevisionsService } from "../content/revisions.service";
import { RevalidationService } from "../content/revalidation.service";

interface SnapshotImage {
  id: string;
  url: string;
  alt: string | null;
}

interface BlogPostSnapshot {
  title: string;
  slug: string;
  excerpt: string | null;
  content: unknown;
  coverImageId: string | null;
  coverImage: SnapshotImage | null;
  galleryImages: SnapshotImage[];
  authorId: string | null;
  categoryIds: string[];
  tagIds: string[];
  seo: Record<string, unknown> | null;
}

const postInclude = {
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
  author: true,
  coverImage: true,
  galleryImages: { include: { media: true }, orderBy: { position: "asc" } },
  seoMetadata: true,
} as const;

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revisions: RevisionsService,
    private readonly revalidation: RevalidationService,
  ) {}

  list(params: { page: number; perPage: number; status?: string }) {
    return this.prisma.blogPost.findMany({
      where: params.status ? { status: params.status as never } : undefined,
      orderBy: { updatedAt: "desc" },
      skip: (params.page - 1) * params.perPage,
      take: params.perPage,
      include: postInclude,
    });
  }

  async getForEditing(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id }, include: postInclude });
    if (!post) throw new NotFoundException("Blog post not found");
    return post;
  }

  /** For the public sitemap — published posts only, minimal fields. */
  listPublishedSlugs() {
    return this.prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, locale: true, updatedAt: true },
    });
  }

  /** Draft lookup by slug — used only by the internal preview endpoint. */
  async getDraftBySlug(slug: string, locale = "en") {
    const post = await this.prisma.blogPost.findUnique({ where: { slug_locale: { slug, locale } }, include: postInclude });
    if (!post) throw new NotFoundException("Blog post not found");
    return post;
  }

  /** Public: reads the published snapshot with real-time comparisons only against `status`/`publishedAt`. */
  async getPublishedBySlug(slug: string, locale = "en") {
    const post = await this.prisma.blogPost.findUnique({ where: { slug_locale: { slug, locale } } });
    if (!post || post.status !== "PUBLISHED" || !post.publishedSnapshot) {
      throw new NotFoundException("Blog post not found");
    }
    return { id: post.id, slug: post.slug, publishedAt: post.publishedAt, ...(post.publishedSnapshot as object) };
  }

  async listPublished(params: { page: number; perPage: number; locale?: string; category?: string; tag?: string; search?: string }) {
    const where = {
      status: "PUBLISHED" as const,
      locale: params.locale ?? "en",
      ...(params.category ? { categories: { some: { category: { slug: params.category } } } } : {}),
      ...(params.tag ? { tags: { some: { tag: { slug: params.tag } } } } : {}),
      ...(params.search
        ? { title: { contains: params.search, mode: "insensitive" as const } }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
      }),
      this.prisma.blogPost.count({ where }),
    ]);
    return {
      items: items.map((p) => ({ id: p.id, slug: p.slug, publishedAt: p.publishedAt, ...(p.publishedSnapshot as object) })),
      total,
    };
  }

  async create(input: CreateBlogPostInput) {
    const existing = await this.prisma.blogPost.findUnique({ where: { slug_locale: { slug: input.slug, locale: input.locale } } });
    if (existing) throw new ConflictException("A blog post with this slug already exists in this locale");

    return this.prisma.blogPost.create({
      data: { title: input.title, slug: input.slug, locale: input.locale, content: {} },
      include: postInclude,
    });
  }

  async update(id: string, input: UpdateBlogPostInput) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException("Blog post not found");

    if (input.slug && input.slug !== post.slug) {
      const clash = await this.prisma.blogPost.findUnique({ where: { slug_locale: { slug: input.slug, locale: post.locale } } });
      if (clash) throw new ConflictException("A blog post with this slug already exists in this locale");
      if (post.status === "PUBLISHED") {
        await this.prisma.redirect.upsert({
          where: { sourcePath: `/blog/${post.slug}` },
          create: { sourcePath: `/blog/${post.slug}`, destinationPath: `/blog/${input.slug}`, statusCode: 301 },
          update: { destinationPath: `/blog/${input.slug}`, isActive: true },
        });
      }
    }

    // Nested relation writes (categories/tags/seoMetadata) and nullable
    // scalar FKs don't type-check cleanly in a single Prisma `update` call
    // (the generated Checked/Unchecked input union can't be inferred), so
    // taxonomy and SEO are applied as separate statements in one
    // transaction instead of one large nested payload.
    const scalarData: Record<string, unknown> = {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      scheduledAt: input.scheduledAt === undefined ? undefined : input.scheduledAt ? new Date(input.scheduledAt) : null,
    };
    if (input.coverImageId !== undefined) scalarData.coverImageId = input.coverImageId;
    if (input.authorId !== undefined) scalarData.authorId = input.authorId;

    const statements = [this.prisma.blogPost.update({ where: { id }, data: scalarData })];

    if (input.categoryIds) {
      statements.push(
        this.prisma.blogPostCategory.deleteMany({ where: { blogPostId: id } }) as never,
        this.prisma.blogPostCategory.createMany({
          data: input.categoryIds.map((categoryId) => ({ blogPostId: id, categoryId })),
        }) as never,
      );
    }
    if (input.tagIds) {
      statements.push(
        this.prisma.blogPostTag.deleteMany({ where: { blogPostId: id } }) as never,
        this.prisma.blogPostTag.createMany({
          data: input.tagIds.map((tagId) => ({ blogPostId: id, tagId })),
        }) as never,
      );
    }
    if (input.galleryImageIds) {
      statements.push(
        this.prisma.blogPostImage.deleteMany({ where: { blogPostId: id } }) as never,
        this.prisma.blogPostImage.createMany({
          data: input.galleryImageIds.map((mediaId, position) => ({ blogPostId: id, mediaId, position })),
        }) as never,
      );
    }
    if (input.seo) {
      statements.push(
        this.prisma.blogPost.update({
          where: { id },
          data: { seoMetadata: { upsert: { create: input.seo, update: input.seo } } },
        }) as never,
      );
    }

    await this.prisma.$transaction(statements);
    return this.getForEditing(id);
  }

  async delete(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException("Blog post not found");
    if (post.status === "PUBLISHED") throw new BadRequestException("Unpublish before deleting");
    await this.prisma.blogPost.delete({ where: { id } });
  }

  async duplicate(id: string) {
    const post = await this.getForEditing(id);
    let slug = `${post.slug}-copy`;
    let suffix = 2;
    while (await this.prisma.blogPost.findUnique({ where: { slug_locale: { slug, locale: post.locale } } })) {
      slug = `${post.slug}-copy-${suffix++}`;
    }
    return this.prisma.blogPost.create({
      data: {
        title: `${post.title} (Copy)`,
        slug,
        locale: post.locale,
        excerpt: post.excerpt,
        content: post.content as never,
        coverImageId: post.coverImageId,
        authorId: post.authorId,
        categories: { create: post.categories.map((c) => ({ categoryId: c.categoryId })) },
        tags: { create: post.tags.map((t) => ({ tagId: t.tagId })) },
        galleryImages: { create: post.galleryImages.map((g) => ({ mediaId: g.mediaId, position: g.position })) },
      },
      include: postInclude,
    });
  }

  async buildSnapshot(id: string): Promise<BlogPostSnapshot> {
    const post = await this.getForEditing(id);
    return {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImageId: post.coverImageId,
      coverImage: post.coverImage ? { id: post.coverImage.id, url: post.coverImage.publicUrl, alt: post.coverImage.alt } : null,
      galleryImages: post.galleryImages.map((g) => ({ id: g.media.id, url: g.media.publicUrl, alt: g.media.alt })),
      authorId: post.authorId,
      categoryIds: post.categories.map((c) => c.categoryId),
      tagIds: post.tags.map((t) => t.tagId),
      seo: post.seoMetadata
        ? {
            seoTitle: post.seoMetadata.seoTitle,
            seoDescription: post.seoMetadata.seoDescription,
            canonicalUrl: post.seoMetadata.canonicalUrl,
            robotsIndex: post.seoMetadata.robotsIndex,
            robotsFollow: post.seoMetadata.robotsFollow,
            ogTitle: post.seoMetadata.ogTitle,
            ogDescription: post.seoMetadata.ogDescription,
            ogImageId: post.seoMetadata.ogImageId,
          }
        : null,
    };
  }

  async publish(id: string, editorId: string | null) {
    const snapshot = await this.buildSnapshot(id);
    const latest = await this.prisma.contentRevision.findFirst({
      where: { entityType: "BLOG_POST", entityId: id },
      orderBy: { version: "desc" },
    });

    const [, post] = await this.prisma.$transaction([
      this.prisma.contentRevision.create({
        data: {
          entityType: "BLOG_POST",
          entityId: id,
          version: (latest?.version ?? 0) + 1,
          snapshot: snapshot as never,
          editorId,
        },
      }),
      this.prisma.blogPost.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt: new Date(), publishedSnapshot: snapshot as never },
      }),
    ]);

    await this.revalidation.revalidateTags([revalidationTags.blogPost(post.slug), revalidationTags.blogList()]);
    return post;
  }

  async unpublish(id: string) {
    const post = await this.prisma.blogPost.update({ where: { id }, data: { status: "DRAFT" } });
    await this.revalidation.revalidateTags([revalidationTags.blogPost(post.slug), revalidationTags.blogList()]);
    return post;
  }

  async archive(id: string) {
    return this.prisma.blogPost.update({ where: { id }, data: { status: "ARCHIVED" } });
  }

  listRevisions(id: string) {
    return this.revisions.listRevisions("BLOG_POST", id);
  }

  async restoreRevision(id: string, version: number) {
    const revision = await this.revisions.getRevision("BLOG_POST", id, version);
    if (!revision) throw new NotFoundException("Revision not found");
    const snapshot = revision.snapshot as unknown as BlogPostSnapshot;

    await this.prisma.blogPost.update({
      where: { id },
      data: {
        title: snapshot.title,
        excerpt: snapshot.excerpt,
        content: snapshot.content as never,
        coverImageId: snapshot.coverImageId,
        authorId: snapshot.authorId,
        categories: { deleteMany: {}, create: snapshot.categoryIds.map((categoryId) => ({ categoryId })) },
        tags: { deleteMany: {}, create: snapshot.tagIds.map((tagId) => ({ tagId })) },
        galleryImages: {
          deleteMany: {},
          create: snapshot.galleryImages.map((img, position) => ({ mediaId: img.id, position })),
        },
      },
    });
    return this.getForEditing(id);
  }

  /** Called by the scheduler (see blog-scheduler.service.ts) — idempotent because publishing flips status away from DRAFT. */
  async publishDueScheduledPosts() {
    const due = await this.prisma.blogPost.findMany({
      where: { status: "DRAFT", scheduledAt: { lte: new Date() } },
    });
    for (const post of due) {
      await this.publish(post.id, null);
    }
    return due.length;
  }
}
