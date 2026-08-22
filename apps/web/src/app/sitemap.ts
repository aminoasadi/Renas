import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/api";
import { config } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { pages, posts } = await getSitemapEntries();

  const pageEntries: MetadataRoute.Sitemap = pages.map((p) => ({
    url: `${config.webUrl}/${p.slug === "home" ? "" : p.slug}`,
    lastModified: new Date(p.updatedAt),
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${config.webUrl}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt),
  }));

  return [...pageEntries, { url: `${config.webUrl}/blog`, lastModified: new Date() }, ...postEntries];
}
