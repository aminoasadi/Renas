import { z } from "zod";
import { PAGE_SECTION_TYPES } from "@renas/shared";
import { slugSchema } from "./common";

export const seoMetadataInputSchema = z.object({
  seoTitle: z.string().max(300).optional(),
  seoDescription: z.string().max(500).optional(),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  robotsIndex: z.boolean().optional(),
  robotsFollow: z.boolean().optional(),
  ogTitle: z.string().max(300).optional(),
  ogDescription: z.string().max(500).optional(),
  ogImageId: z.string().uuid().optional(),
});
export type SeoMetadataInput = z.infer<typeof seoMetadataInputSchema>;

export const createPageSchema = z.object({
  title: z.string().min(1).max(300),
  slug: slugSchema,
  locale: z.string().min(2).max(10).default("en"),
});
export type CreatePageInput = z.infer<typeof createPageSchema>;

export const updatePageSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  slug: slugSchema.optional(),
  createRedirectOnSlugChange: z.boolean().optional().default(true),
  seo: seoMetadataInputSchema.optional(),
});
export type UpdatePageInput = z.infer<typeof updatePageSchema>;

export const pageSectionTypeSchema = z.enum(PAGE_SECTION_TYPES);

export const createSectionSchema = z.object({
  type: pageSectionTypeSchema,
  position: z.number().int().min(0).optional(),
  content: z.unknown(),
  isVisible: z.boolean().optional().default(true),
});
export type CreateSectionInput = z.infer<typeof createSectionSchema>;

export const updateSectionSchema = z.object({
  content: z.unknown().optional(),
  isVisible: z.boolean().optional(),
});
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

export const reorderSectionsSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});
export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>;
