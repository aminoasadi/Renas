import type { Metadata } from "next";
import type { PublicPage, PublicBlogPost, PublicSettings } from "./api";
import { config } from "./config";
import { DEFAULT_LOCALE, type Locale } from "./i18n";

interface SeoLike {
  seo: PublicPage["seo"];
  title: string;
  slug: string;
  coverImageUrl?: string;
}

/**
 * Every published Page and BlogPost funnels through here for its
 * `generateMetadata` — one place that maps the CMS's SeoMetadata shape onto
 * Next.js's Metadata API, so canonical/OG/Twitter/robots behavior can't
 * drift between routes. `path` is locale-agnostic (e.g. "/about") — the
 * locale prefix and the alternate-language links are both derived here.
 */
export function buildMetadata(entity: SeoLike, settings: PublicSettings, path: string, locale: Locale = DEFAULT_LOCALE): Metadata {
  const seo = entity.seo;
  const title = seo?.seoTitle || entity.title;
  const description =
    seo?.seoDescription || (locale === "fa" ? settings.defaultSeoDescriptionFa : settings.defaultSeoDescription) || undefined;
  const canonical = seo?.canonicalUrl || `${config.webUrl}/${locale}${path}`;
  const ogImage = entity.coverImageUrl;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${config.webUrl}/en${path}`,
        fa: `${config.webUrl}/fa${path}`,
      },
    },
    robots: {
      index: seo?.robotsIndex ?? true,
      follow: seo?.robotsFollow ?? true,
    },
    openGraph: {
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      url: canonical,
      siteName: settings.companyName,
      images: ogImage ? [{ url: ogImage }] : undefined,
      type: "website",
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export function organizationJsonLd(settings: PublicSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.companyName,
    url: config.webUrl,
    ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.officeAddress ? { address: settings.officeAddress } : {}),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>, locale: Locale = DEFAULT_LOCALE) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${config.webUrl}/${locale}${item.path}`,
    })),
  };
}

export function articleJsonLd(post: PublicBlogPost, settings: PublicSettings, locale: Locale = DEFAULT_LOCALE) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverImage?.url ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    author: { "@type": "Organization", name: settings.companyName },
    publisher: { "@type": "Organization", name: settings.companyName },
    mainEntityOfPage: `${config.webUrl}/${locale}/blog/${post.slug}`,
  };
}
