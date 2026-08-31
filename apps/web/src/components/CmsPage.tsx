import { notFound } from "next/navigation";
import { SectionRenderer } from "./SectionRenderer";
import { SiteMotion } from "./SiteMotion";
import { getPage, NotFoundError } from "@/lib/api";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

export async function CmsPage({ slug, locale = DEFAULT_LOCALE }: { slug: string; locale?: Locale }) {
  try {
    const page = await getPage(slug, locale);
    return (
      <>
        <SectionRenderer sections={page.sections} locale={locale} />
        <SiteMotion />
      </>
    );
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
