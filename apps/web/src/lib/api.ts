import { draftMode } from "next/headers";
import { config } from "./config";
import type { AnyPageSection } from "@renas/shared";

export interface PublicPage {
  id: string;
  slug: string;
  title: string;
  locale: string;
  seo: PublicSeo | null;
  sections: AnyPageSection[];
  publishedAt: string | null;
}

export interface PublicSeo {
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImageId?: string;
}

export interface PublicNavigationItem {
  id: string;
  label: string;
  url: string;
  isExternal: boolean;
  target: string;
  isVisible: boolean;
}
export interface PublicNavigation {
  key: "HEADER" | "FOOTER";
  items: PublicNavigationItem[];
}

export interface PublicSettings {
  companyName: string;
  defaultSeoTitle: string | null;
  defaultSeoDescription: string | null;
  contactEmail: string | null;
  phone: string | null;
  whatsapp: string | null;
  linkedin: string | null;
  officeAddress: string | null;
  footerText: string | null;
  socialLinks: Record<string, string> | null;
}

export interface PublicBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: unknown;
  coverImageId: string | null;
  authorId: string | null;
  categoryIds: string[];
  tagIds: string[];
  seo: PublicSeo | null;
  publishedAt: string | null;
}

class NotFoundError extends Error {}

async function apiFetch<T>(
  path: string,
  opts: { tags?: string[]; revalidate?: number | false; cache?: RequestCache } = {},
): Promise<T> {
  const res = await fetch(`${config.apiUrl}/api/v1${path}`, {
    next: opts.tags ? { tags: opts.tags, revalidate: opts.revalidate } : undefined,
    cache: opts.tags ? undefined : (opts.cache ?? "no-store"),
  });

  if (res.status === 404) throw new NotFoundError(path);
  if (!res.ok) throw new Error(`API request failed: ${path} (${res.status})`);

  const body = await res.json();
  return body.data as T;
}

/** Internal, server-to-server only — never callable from the browser (see the API's InternalSecretGuard). */
async function internalFetch<T>(path: string): Promise<T | null> {
  const res = await fetch(`${config.apiUrl}/api/v1/internal${path}`, {
    headers: { "x-preview-secret": config.previewSecret },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Internal API request failed: ${path} (${res.status})`);
  const body = await res.json();
  return body.data as T;
}

/**
 * The single entry point every page uses to load a CMS page. Transparently
 * serves the draft when Next.js Draft Mode is enabled (i.e. an editor is
 * actively previewing), and the published, tag-cached snapshot otherwise —
 * callers never need to know which mode they're in.
 */
export async function getPage(slug: string): Promise<PublicPage> {
  const { isEnabled } = await draftMode();
  if (isEnabled) {
    const draft = await internalFetch<PublicPage>(`/pages/${slug}/draft`);
    if (!draft) throw new NotFoundError(slug);
    return draft;
  }
  return apiFetch<PublicPage>(`/public/pages/${slug}`, { tags: [`page:${slug}`] });
}

export async function getNavigation(key: "HEADER" | "FOOTER"): Promise<PublicNavigation> {
  return apiFetch(`/public/navigation/${key}`, { tags: ["navigation"] });
}

export async function getSettings(): Promise<PublicSettings> {
  return apiFetch(`/public/settings`, { tags: ["site-settings"] });
}

export async function getBlogPost(slug: string): Promise<PublicBlogPost> {
  const { isEnabled } = await draftMode();
  if (isEnabled) {
    const draft = await internalFetch<PublicBlogPost>(`/blog/${slug}/draft`);
    if (!draft) throw new NotFoundError(slug);
    return draft;
  }
  return apiFetch<PublicBlogPost>(`/public/blog/${slug}`, { tags: [`blog:post:${slug}`] });
}

export async function listBlogPosts(params: {
  page?: number;
  perPage?: number;
  category?: string;
  tag?: string;
  search?: string;
}): Promise<{ items: PublicBlogPost[]; total: number }> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.perPage) query.set("perPage", String(params.perPage));
  if (params.category) query.set("category", params.category);
  if (params.tag) query.set("tag", params.tag);
  if (params.search) query.set("search", params.search);
  return apiFetch(`/public/blog?${query.toString()}`, { tags: ["blog:list"] });
}

export async function resolveRedirect(path: string): Promise<{ destinationPath: string; statusCode: number } | null> {
  try {
    return await apiFetch(`/public/redirects/resolve?path=${encodeURIComponent(path)}`, { cache: "no-store" });
  } catch {
    return null;
  }
}

export async function getSitemapEntries(): Promise<{
  pages: Array<{ slug: string; locale: string; updatedAt: string }>;
  posts: Array<{ slug: string; updatedAt: string }>;
}> {
  return apiFetch(`/public/sitemap`, { cache: "no-store" });
}

export { NotFoundError };
