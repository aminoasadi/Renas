import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import { getBlogPost, getSettings, listBlogPosts, NotFoundError } from "@/lib/api";
import { TipTapRenderer } from "@/components/TipTapRenderer";
import { buildMetadata, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { BlogViewTracker } from "@/components/BlogViewTracker";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  try {
    const [post, settings] = await Promise.all([getBlogPost(slug, locale), getSettings()]);
    return buildMetadata({ seo: post.seo, title: post.title, slug: post.slug }, settings, `/blog/${slug}`, locale);
  } catch (error) {
    if (error instanceof NotFoundError) return {};
    throw error;
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const { isEnabled: isPreview } = await draftMode();

  let post;
  try {
    post = await getBlogPost(slug, locale);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const [settings, related] = await Promise.all([
    getSettings(),
    isPreview ? Promise.resolve({ items: [] }) : listBlogPosts({ locale, perPage: 3 }),
  ]);
  const relatedPosts = related.items.filter((p) => p.slug !== slug).slice(0, 3);
  const isFa = locale === "fa";

  return (
    <article className="section section--cream" data-theme-bg="cream">
      <div className="container" style={{ maxWidth: "760px" }}>
        <p className="eyebrow">{isFa ? "مقاله" : "ARTICLE"}</p>
        <h1 className="headline" style={{ fontSize: "var(--fs-display)", margin: "var(--sp-4) 0 var(--sp-5)" }}>
          {post.title}
        </h1>
        {post.publishedAt && (
          <p className="meta" style={{ marginBottom: post.coverImage ? "var(--sp-6)" : "var(--sp-7)" }}>
            {new Date(post.publishedAt).toLocaleDateString(isFa ? "fa-IR" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}

        {post.coverImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={post.coverImage.url}
            alt={post.coverImage.alt ?? ""}
            className="m-post__cover"
          />
        )}

        <TipTapRenderer document={post.content} />

        {(post.galleryImages ?? []).length > 0 && (
          <div className="m-post__gallery" data-count={post.galleryImages.length}>
            {post.galleryImages.map((img) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img key={img.id} src={img.url} alt={img.alt ?? ""} />
            ))}
          </div>
        )}

        {relatedPosts.length > 0 && (
          <div style={{ marginTop: "var(--sp-9)", borderTop: "var(--border-thin) solid var(--rule-on-cream)", paddingTop: "var(--sp-6)" }}>
            <p className="eyebrow">{isFa ? "مرتبط" : "RELATED"}</p>
            <ul>
              {relatedPosts.map((p) => (
                <li key={p.id}>
                  <a href={`/${locale}/blog/${p.slug}`}>{p.title}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(post, settings, locale)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([{ name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${slug}` }], locale),
          ),
        }}
      />
      <BlogViewTracker slug={slug} />
    </article>
  );
}
