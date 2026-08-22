import type { Metadata } from "next";
import { getPage, getSettings, NotFoundError } from "./api";
import { buildMetadata } from "./seo";

export async function generatePageMetadata(slug: string, path: string): Promise<Metadata> {
  try {
    const [page, settings] = await Promise.all([getPage(slug), getSettings()]);
    return buildMetadata({ seo: page.seo, title: page.title, slug: page.slug }, settings, path);
  } catch (error) {
    if (error instanceof NotFoundError) return {};
    throw error;
  }
}
