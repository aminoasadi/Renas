import type { AnyPageSection, PageSectionType } from "@renas/shared";
import { sectionContentSchemas } from "@renas/validation";
import { HeroSection } from "./sections/HeroSection";
import { RichTextSection } from "./sections/RichTextSection";
import { ProcessSection } from "./sections/ProcessSection";
import { SupplyCategoriesSection } from "./sections/SupplyCategoriesSection";
import { SupplySystemSection } from "./sections/SupplySystemSection";
import { ComponentIndexSection } from "./sections/ComponentIndexSection";
import { DecisionLayerSection } from "./sections/DecisionLayerSection";
import { RouteStoriesSection } from "./sections/RouteStoriesSection";
import { OperationalSignalsSection } from "./sections/OperationalSignalsSection";
import { CapabilitySection } from "./sections/CapabilitySection";
import { PrinciplesSection } from "./sections/PrinciplesSection";
import { CTASection } from "./sections/CTASection";
import { ImageSection } from "./sections/ImageSection";
import { ImageTextSection } from "./sections/ImageTextSection";
import { FaqSection } from "./sections/FaqSection";

/**
 * The controlled section registry, frontend side. A section's `type` is
 * the only thing that decides which component renders it — there is no
 * path from CMS content to arbitrary code execution. An unrecognized type
 * (e.g. a section type added to the backend enum but not yet given a
 * frontend component) fails gracefully by rendering nothing rather than
 * crashing the page.
 */
const sectionRegistry: Record<PageSectionType, React.ComponentType<{ content: unknown }>> = {
  hero: HeroSection,
  rich_text: RichTextSection,
  process: ProcessSection,
  supply_categories: SupplyCategoriesSection,
  supply_system: SupplySystemSection,
  component_index: ComponentIndexSection,
  decision_layer: DecisionLayerSection,
  route_stories: RouteStoriesSection,
  operational_signals: OperationalSignalsSection,
  capability: CapabilitySection,
  principles: PrinciplesSection,
  cta: CTASection,
  image: ImageSection,
  image_text: ImageTextSection,
  faq: FaqSection,
};

export function SectionRenderer({ sections }: { sections: AnyPageSection[] }) {
  return (
    <>
      {sections
        .filter((s) => s.isVisible)
        .map((section) => {
          const Component = sectionRegistry[section.type];
          if (!Component) return null;

          // Content is re-validated here, at render time, rather than
          // trusted just because it came from the internal API — a section
          // whose stored content has drifted from its schema (a manual DB
          // edit, a bug in an older admin build) renders nothing instead of
          // throwing a page-crashing error or rendering malformed markup.
          const schema = sectionContentSchemas[section.type];
          const result = schema.safeParse(section.content);
          if (!result.success) {
            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.error(`Invalid content for section ${section.id} (${section.type}):`, result.error.issues);
            }
            return null;
          }

          return <Component key={section.id} content={result.data} />;
        })}
    </>
  );
}
