import { z } from "zod";
import { slugSchema } from "./common";
import { seoMetadataInputSchema } from "./pages";

export const createBlogPostSchema = z.object({
  title: z.string().min(1).max(300),
  slug: slugSchema,
  locale: z.string().min(2).max(10).default("en"),
});
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;

export const updateBlogPostSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  slug: slugSchema.optional(),
  excerpt: z.string().max(600).optional(),
  /** TipTap editor document (structured JSON), not raw HTML. */
  content: z.unknown().optional(),
  coverImageId: z.string().uuid().nullable().optional(),
  authorId: z.string().uuid().nullable().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  /** Up to 3 extra images shown on the post, in addition to the cover image. */
  galleryImageIds: z.array(z.string().uuid()).max(3).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  seo: seoMetadataInputSchema.optional(),
});
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;

export const createTaxonomySchema = z.object({
  name: z.string().min(1).max(200),
  slug: slugSchema,
});
export type CreateTaxonomyInput = z.infer<typeof createTaxonomySchema>;

export const createAuthorSchema = z.object({
  name: z.string().min(1).max(200),
  bio: z.string().max(2000).optional(),
  email: z.string().email().optional(),
  avatarMediaId: z.string().uuid().optional(),
});
export type CreateAuthorInput = z.infer<typeof createAuthorSchema>;
