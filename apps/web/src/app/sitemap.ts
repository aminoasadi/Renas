import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/api";
import { config } from "@/lib/config";

// Requires a live API call and the real WEB_URL — both only guaranteed once
// the container is actually running, not during the Docker build.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { pages, posts } = await getSitemapEntries();

  const pageEntries: MetadataRoute.Sitemap = pages.map((p) => ({
    url: `${config.webUrl}/${p.locale}/${p.slug === "home" ? "" : p.slug}`,
    lastModified: new Date(p.updatedAt),
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${config.webUrl}/${p.locale}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt),
  }));

  const blogIndexEntries: MetadataRoute.Sitemap = ["en", "fa"].map((locale) => ({
    url: `${config.webUrl}/${locale}/blog`,
    lastModified: new Date(),
  }));

  return [...pageEntries, ...blogIndexEntries, ...postEntries];
}
