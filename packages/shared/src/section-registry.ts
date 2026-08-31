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
  "supply_equation",
  "heavy_vehicle_focus",
  "requirement_composer",
  // --- Long-form editorial archetypes -------------------------------
  // Deliberately distinct from the homepage's section set: these are
  // prose- and table-led compositions built to carry substantially more
  // indexable copy (real headings, definition lists, Q&A) than the
  // homepage's typography- and motion-led sections do.
  "page_masthead",
  "editorial_dossier",
  "spec_table",
  "stage_dossier",
  "narrative_feature",
  "glossary",
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

export interface SupplyEquationTerm {
  term: string;
  label: string;
  copy: string;
  isResult?: boolean;
}
export interface SupplyEquationContent {
  eyebrow?: string;
  terms: SupplyEquationTerm[];
  footNote?: string;
}

export interface HeavyVehicleFocusContent {
  headline: string;
  subheadline?: string;
  body?: string;
  media: MediaRef;
  cta?: { label: string; href: string };
  overlayLabels?: string[];
}

/**
 * Only the static surrounding copy is CMS-editable — the multi-step wizard
 * itself (fields, validation, submission) stays code-driven since it's wired
 * to the fixed RFQ schema, not arbitrary content.
 */
export interface RequirementComposerContent {
  eyebrow?: string;
  headline: string;
  body?: string;
}

// ---- Long-form editorial archetypes ---------------------------------

/**
 * Editorial page header. Replaces the homepage's image-grid `hero` on inner
 * pages: the weight sits in a standfirst and an at-a-glance summary rather
 * than in photography, so a page opens with indexable prose instead of a
 * headline alone. `variant` changes the composition, not the content shape.
 */
export interface PageMastheadContent {
  variant: "stacked" | "split" | "indexed";
  kicker: string;
  headline: string;
  /** Long opening paragraph — the page's lede, not a one-line tagline. */
  standfirst: string;
  /** Secondary paragraph, shown below the standfirst where present. */
  intro?: string;
  /** Scannable "what this page covers" bullets. */
  summaryPoints?: string[];
  /** Mono label/value pairs (e.g. SCOPE / REGIONAL TRADE). */
  meta?: Array<{ label: string; value: string }>;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export interface DossierChapter {
  /** Slug used for the in-page anchor and the sticky contents list. */
  id: string;
  number: string;
  title: string;
  /** Each entry renders as its own <p>. */
  body: string[];
  /** Optional sub-heading + bullets, rendered as an <h4> + list. */
  keyPointsTitle?: string;
  keyPoints?: string[];
}
/**
 * Long-form dossier: a sticky table of contents beside numbered prose
 * chapters. The heading hierarchy (h2 per chapter, h4 per key-point block)
 * and the anchor list are the point — this is the most SEO-dense archetype.
 */
export interface EditorialDossierContent {
  eyebrow?: string;
  headline: string;
  intro?: string;
  contentsLabel?: string;
  chapters: DossierChapter[];
}

export interface SpecTableRow {
  term: string;
  detail: string;
  /** Optional third column, e.g. typical part types or a note. */
  note?: string;
}
export interface SpecTableGroup {
  id: string;
  number?: string;
  title: string;
  description?: string;
  columns?: { term: string; detail: string; note?: string };
  rows: SpecTableRow[];
}
/** Grouped specification tables — structured, scannable, and indexable. */
export interface SpecTableContent {
  eyebrow?: string;
  headline: string;
  intro?: string;
  groups: SpecTableGroup[];
  footNote?: string;
}

export interface DossierStage {
  number: string;
  title: string;
  /** Mono meta line, e.g. "TYPICALLY 2–5 DAYS". */
  duration?: string;
  body: string;
  inputsTitle?: string;
  inputs?: string[];
  outputsTitle?: string;
  outputs?: string[];
}
/**
 * Annotated stages on a continuous rule. Unlike the homepage's `process`
 * (index + title + one line), each stage carries a full paragraph plus
 * explicit "what we need" / "what you get" lists.
 */
export interface StageDossierContent {
  eyebrow?: string;
  headline: string;
  intro?: string;
  stages: DossierStage[];
  closingNote?: string;
}

export type NarrativeBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "subheading"; text: string }
  | { kind: "pullquote"; text: string; attribution?: string };
/**
 * Long-form narrative feature — drop-capped opening, subheadings and pull
 * quotes. Pure prose, for pages whose job is to be read rather than scanned.
 */
export interface NarrativeFeatureContent {
  eyebrow?: string;
  headline: string;
  standfirst?: string;
  blocks: NarrativeBlock[];
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  /** Synonyms / alternate names, rendered as a mono "also:" line. */
  aka?: string[];
}
/**
 * A real definition list (<dl>) of domain terminology. Semantically rich,
 * highly indexable, and a natural fit for the system's mono/serif contrast.
 */
export interface GlossaryContent {
  eyebrow?: string;
  headline: string;
  intro?: string;
  entries: GlossaryEntry[];
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
  supply_equation: SupplyEquationContent;
  heavy_vehicle_focus: HeavyVehicleFocusContent;
  requirement_composer: RequirementComposerContent;
  page_masthead: PageMastheadContent;
  editorial_dossier: EditorialDossierContent;
  spec_table: SpecTableContent;
  stage_dossier: StageDossierContent;
  narrative_feature: NarrativeFeatureContent;
  glossary: GlossaryContent;
};

export type PageSectionOf<T extends PageSectionType = PageSectionType> = {
  id: string;
  type: T;
  position: number;
  isVisible: boolean;
  content: SectionContentMap[T];
};

export type AnyPageSection = { [K in PageSectionType]: PageSectionOf<K> }[PageSectionType];
