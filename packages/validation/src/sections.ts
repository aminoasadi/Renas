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

export const supplyEquationContentSchema = z.object({
  eyebrow: z.string().optional(),
  terms: z
    .array(
      z.object({
        term: z.string().min(1),
        label: z.string().min(1),
        copy: z.string().min(1),
        isResult: z.boolean().optional(),
      }),
    )
    .min(2),
  footNote: z.string().optional(),
});

export const heavyVehicleFocusContentSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  body: z.string().optional(),
  media: mediaRefSchema,
  cta: ctaLink.optional(),
  overlayLabels: z.array(z.string()).optional(),
});

export const requirementComposerContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  body: z.string().optional(),
});

// ---- Long-form editorial archetypes ---------------------------------

// Used as in-page anchor ids, so they must be URL-safe.
const anchorId = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only");

export const pageMastheadContentSchema = z.object({
  variant: z.enum(["stacked", "split", "indexed"]),
  kicker: z.string().min(1),
  headline: z.string().min(1),
  standfirst: z.string().min(1),
  intro: z.string().optional(),
  summaryPoints: z.array(z.string().min(1)).max(6).optional(),
  meta: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).max(6).optional(),
  primaryCta: ctaLink.optional(),
  secondaryCta: ctaLink.optional(),
});

export const editorialDossierContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  intro: z.string().optional(),
  contentsLabel: z.string().optional(),
  chapters: z
    .array(
      z.object({
        id: anchorId,
        number: z.string().min(1),
        title: z.string().min(1),
        body: z.array(z.string().min(1)).min(1),
        keyPointsTitle: z.string().optional(),
        keyPoints: z.array(z.string().min(1)).optional(),
      }),
    )
    .min(1),
});

export const specTableContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  intro: z.string().optional(),
  groups: z
    .array(
      z.object({
        id: anchorId,
        number: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        columns: z
          .object({ term: z.string().min(1), detail: z.string().min(1), note: z.string().optional() })
          .optional(),
        rows: z
          .array(z.object({ term: z.string().min(1), detail: z.string().min(1), note: z.string().optional() }))
          .min(1),
      }),
    )
    .min(1),
  footNote: z.string().optional(),
});

export const stageDossierContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  intro: z.string().optional(),
  stages: z
    .array(
      z.object({
        number: z.string().min(1),
        title: z.string().min(1),
        duration: z.string().optional(),
        body: z.string().min(1),
        inputsTitle: z.string().optional(),
        inputs: z.array(z.string().min(1)).optional(),
        outputsTitle: z.string().optional(),
        outputs: z.array(z.string().min(1)).optional(),
      }),
    )
    .min(1),
  closingNote: z.string().optional(),
});

export const narrativeFeatureContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  standfirst: z.string().optional(),
  blocks: z
    .array(
      z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("paragraph"), text: z.string().min(1) }),
        z.object({ kind: z.literal("subheading"), text: z.string().min(1) }),
        z.object({ kind: z.literal("pullquote"), text: z.string().min(1), attribution: z.string().optional() }),
      ]),
    )
    .min(1),
});

export const glossaryContentSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  intro: z.string().optional(),
  entries: z
    .array(
      z.object({
        term: z.string().min(1),
        definition: z.string().min(1),
        aka: z.array(z.string().min(1)).optional(),
      }),
    )
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
  supply_equation: supplyEquationContentSchema,
  heavy_vehicle_focus: heavyVehicleFocusContentSchema,
  requirement_composer: requirementComposerContentSchema,
  page_masthead: pageMastheadContentSchema,
  editorial_dossier: editorialDossierContentSchema,
  spec_table: specTableContentSchema,
  stage_dossier: stageDossierContentSchema,
  narrative_feature: narrativeFeatureContentSchema,
  glossary: glossaryContentSchema,
} as const;

export type SectionType = keyof typeof sectionContentSchemas;

export function validateSectionContent(type: SectionType, content: unknown) {
  const schema = sectionContentSchemas[type];
  if (!schema) {
    throw new Error(`Unknown section type: ${type}`);
  }
  return schema.parse(content);
}
