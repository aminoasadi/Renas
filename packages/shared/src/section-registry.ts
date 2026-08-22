/**
 * The controlled section registry.
 *
 * A PageSection's `type` determines which frontend component renders it and
 * which shape its `content` JSON must satisfy. This file is the single
 * source of truth for that mapping — the Prisma `PageSectionType` enum, the
 * Zod schemas in `@renas/validation`, the admin's section editors, and the
 * web app's section renderers must all agree with what's declared here.
 * Adding a new section type means updating all four in lockstep; it is
 * deliberately NOT possible to render arbitrary/unregistered section types
 * or raw unsanitized markup.
 */

export const PAGE_SECTION_TYPES = [
  "hero",
  "rich_text",
  "process",
  "supply_categories",
  "supply_system",
  "component_index",
  "decision_layer",
  "route_stories",
  "operational_signals",
  "capability",
  "principles",
  "cta",
  "image",
  "image_text",
  "faq",
] as const;

export type PageSectionType = (typeof PAGE_SECTION_TYPES)[number];

export interface MediaRef {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

// ---- Per-type content shapes -----------------------------------------

export interface HeroContent {
  eyebrow: string;
  headlineLines: string[];
  supportingLine?: string;
  intro?: string;
  images: Array<{ media: MediaRef; metaLabel?: string }>;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export interface RichTextContent {
  /** Sanitized HTML produced by the shared rich-text sanitizer, never raw client HTML. */
  html: string;
}

export interface ProcessStep {
  index: string;
  title: string;
  body: string;
}
export interface ProcessContent {
  eyebrow?: string;
  headline: string;
  steps: ProcessStep[];
}

export interface SupplyCategoryItem {
  title: string;
  description?: string;
  media?: MediaRef;
}
export interface SupplyCategoriesContent {
  eyebrow?: string;
  headline: string;
  items: SupplyCategoryItem[];
}

export interface SupplySystemNode {
  key: string;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  connects: string[]; // keys of related nodes
  description: string;
}
export interface SupplySystemContent {
  eyebrow?: string;
  headline: string;
  centerLabel: string;
  centerSubLabel?: string;
  nodes: SupplySystemNode[];
}

export interface ComponentIndexItem {
  number: string;
  label: string;
  media: MediaRef;
  metaLines?: string[];
}
export interface ComponentIndexContent {
  eyebrow?: string;
  headline: string;
  items: ComponentIndexItem[];
  cta?: { label: string; href: string };
}

export interface DecisionFactor {
  index: string;
  bigWord: string;
  title: string;
  body: string;
}
export interface DecisionLayerContent {
  eyebrow?: string;
  headline: string;
  supportingLine?: string;
  factors: DecisionFactor[];
}

export interface RouteStory {
  label: string;
  title: string;
  body: string;
  media: MediaRef;
}
export interface RouteStoriesContent {
  eyebrow?: string;
  headline: string;
  supportingLine?: string;
  stories: RouteStory[];
}

export interface OperationalSignalsContent {
  eyebrow?: string;
  headline: string;
  centerLine?: string;
  signals: Array<{ key: string; label: string; description: string }>;
}

export interface CapabilityContent {
  headline: string;
  supportingLine?: string;
  media: MediaRef;
  overlayLabels?: string[];
  cta?: { label: string; href: string };
}

export interface PrincipleItem {
  index: string;
  title: string;
  body: string;
}
export interface PrinciplesContent {
  eyebrow?: string;
  headline: string;
  items: PrincipleItem[];
  closingLine?: string;
}

export interface CtaContent {
  eyebrow?: string;
  headline: string;
  body?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export interface ImageContent {
  media: MediaRef;
  caption?: string;
}

export interface ImageTextContent {
  media: MediaRef;
  headline: string;
  body: string;
  mediaPosition: "left" | "right";
}

export interface FaqItem {
  question: string;
  answer: string;
}
export interface FaqContent {
  eyebrow?: string;
  headline: string;
  items: FaqItem[];
}

// ---- Discriminated union --------------------------------------------

export type SectionContentMap = {
  hero: HeroContent;
  rich_text: RichTextContent;
  process: ProcessContent;
  supply_categories: SupplyCategoriesContent;
  supply_system: SupplySystemContent;
  component_index: ComponentIndexContent;
  decision_layer: DecisionLayerContent;
  route_stories: RouteStoriesContent;
  operational_signals: OperationalSignalsContent;
  capability: CapabilityContent;
  principles: PrinciplesContent;
  cta: CtaContent;
  image: ImageContent;
  image_text: ImageTextContent;
  faq: FaqContent;
};

export type PageSectionOf<T extends PageSectionType = PageSectionType> = {
  id: string;
  type: T;
  position: number;
  isVisible: boolean;
  content: SectionContentMap[T];
};

export type AnyPageSection = { [K in PageSectionType]: PageSectionOf<K> }[PageSectionType];
