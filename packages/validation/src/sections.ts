import { z } from "zod";
import { mediaRefSchema } from "./common";

const ctaLink = z.object({ label: z.string().min(1), href: z.string().min(1) });

export const heroContentSchema = z.object({
  eyebrow: z.string().min(1),
  headlineLines: z.array(z.string().min(1)).min(1).max(4),
  supportingLine: z.string().optional(),
  intro: z.string().optional(),
  // Drafts may start with no imagery (an editor writing copy before media is
  // ready is a normal, valid draft state) — the max of 3 still bounds the
  // hero's grid layout, but the minimum is enforced only as an editorial
  // warning in the admin UI before publish, not as a hard schema rule.
  images: z
    .array(z.object({ media: mediaRefSchema, metaLabel: z.string().optional() }))
    .max(3),
  primaryCta: ctaLink.optional(),
  secondaryCta: ctaLink.optional(),
});

export const richTextContentSchema = z.object({
  html: z.string(),
});

export const processContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  steps: z
    .array(
      z.object({
        index: z.string().min(1),
        title: z.string().min(1),
        body: z.string().min(1),
      }),
    )
    .min(1),
});

export const supplyCategoriesContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  items: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        media: mediaRefSchema.optional(),
      }),
    )
    .min(1),
});

export const supplySystemContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  centerLabel: z.string().min(1),
  centerSubLabel: z.string().optional(),
  nodes: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        x: z.number().min(0).max(100),
        y: z.number().min(0).max(100),
        connects: z.array(z.string()),
        description: z.string().min(1),
      }),
    )
    .min(1),
});

export const componentIndexContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  items: z
    .array(
      z.object({
        number: z.string().min(1),
        label: z.string().min(1),
        media: mediaRefSchema,
        metaLines: z.array(z.string()).optional(),
      }),
    )
    .min(1),
  cta: ctaLink.optional(),
});

export const decisionLayerContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  supportingLine: z.string().optional(),
  factors: z
    .array(
      z.object({
        index: z.string().min(1),
        bigWord: z.string().min(1),
        title: z.string().min(1),
        body: z.string().min(1),
      }),
    )
    .min(1),
});

export const routeStoriesContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  supportingLine: z.string().optional(),
  stories: z
    .array(
      z.object({
        label: z.string().min(1),
        title: z.string().min(1),
        body: z.string().min(1),
        media: mediaRefSchema,
      }),
    )
    .min(1),
});

export const operationalSignalsContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  centerLine: z.string().optional(),
  signals: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .min(1),
});

export const capabilityContentSchema = z.object({
  headline: z.string().min(1),
  supportingLine: z.string().optional(),
  media: mediaRefSchema,
  overlayLabels: z.array(z.string()).optional(),
  cta: ctaLink.optional(),
});

export const principlesContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  items: z
    .array(
      z.object({
        index: z.string().min(1),
        title: z.string().min(1),
        body: z.string().min(1),
      }),
    )
    .min(1),
  closingLine: z.string().optional(),
});

export const ctaContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  body: z.string().optional(),
  primaryCta: ctaLink,
  secondaryCta: ctaLink.optional(),
});

export const imageContentSchema = z.object({
  media: mediaRefSchema,
  caption: z.string().optional(),
});

export const imageTextContentSchema = z.object({
  media: mediaRefSchema,
  headline: z.string().min(1),
  body: z.string().min(1),
  mediaPosition: z.enum(["left", "right"]),
});

export const faqContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  items: z
    .array(z.object({ question: z.string().min(1), answer: z.string().min(1) }))
    .min(1),
});

/** Maps each PageSectionType to its Zod schema — used to validate `content` server-side before persisting. */
export const sectionContentSchemas = {
  hero: heroContentSchema,
  rich_text: richTextContentSchema,
  process: processContentSchema,
  supply_categories: supplyCategoriesContentSchema,
  supply_system: supplySystemContentSchema,
  component_index: componentIndexContentSchema,
  decision_layer: decisionLayerContentSchema,
  route_stories: routeStoriesContentSchema,
  operational_signals: operationalSignalsContentSchema,
  capability: capabilityContentSchema,
  principles: principlesContentSchema,
  cta: ctaContentSchema,
  image: imageContentSchema,
  image_text: imageTextContentSchema,
  faq: faqContentSchema,
} as const;

export type SectionType = keyof typeof sectionContentSchemas;

export function validateSectionContent(type: SectionType, content: unknown) {
  const schema = sectionContentSchemas[type];
  if (!schema) {
    throw new Error(`Unknown section type: ${type}`);
  }
  return schema.parse(content);
}
