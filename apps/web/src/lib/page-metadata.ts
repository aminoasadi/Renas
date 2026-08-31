import type { Metadata } from "next";
import { getPage, getSettings, NotFoundError } from "./api";
import { buildMetadata } from "./seo";
import { DEFAULT_LOCALE, type Locale } from "./i18n";

export async function generatePageMetadata(slug: string, path: string, locale: Locale = DEFAULT_LOCALE): Promise<Metadata> {
  try {
    const [page, settings] = await Promise.all([getPage(slug, locale), getSettings()]);
    return buildMetadata({ seo: page.seo, title: page.title, slug: page.slug }, settings, path, locale);
  } catch (error) {
    if (error instanceof NotFoundError) return {};
    throw error;
  }
}
