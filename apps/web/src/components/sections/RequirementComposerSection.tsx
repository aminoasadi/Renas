import type { RequirementComposerContent } from "@renas/shared";
import { RequestSupplyForm } from "../RequestSupplyForm";
import type { Locale } from "@/lib/i18n";

/**
 * Thin adapter so the section registry's uniform `{ content: unknown }`
 * shape can drive `RequestSupplyForm`'s header copy — the form itself stays
 * code-driven (fixed RFQ fields), only the surrounding copy is CMS content.
 */
export function RequirementComposerSection({ content, locale }: { content: unknown; locale?: Locale }) {
  const c = content as RequirementComposerContent;
  return <RequestSupplyForm eyebrow={c.eyebrow} headline={c.headline} body={c.body} locale={locale} />;
}
