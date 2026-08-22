import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import { getBlogPost, getSettings, listBlogPosts, NotFoundError } from "@/lib/api";
import { TipTapRenderer } from "@/components/TipTapRenderer";
import { buildMetadata, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { BlogViewTracker } from "@/components/BlogViewTracker";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [post, settings] = await Promise.all([getBlogPost(slug), getSettings()]);
    return buildMetadata({ seo: post.seo, title: post.title, slug: post.slug }, settings, `/blog/${slug}`);
  } catch (error) {
    if (error instanceof NotFoundError) return {};
    throw error;
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { isEnabled: isPreview } = await draftMode();

  let post;
  try {
    post = await getBlogPost(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const [settings, related] = await Promise.all([
    getSettings(),
    isPreview ? Promise.resolve({ items: [] }) : listBlogPosts({ perPage: 3 }),
  ]);
  const relatedPosts = related.items.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <article className="section section--cream" data-theme-bg="cream">
      <div className="container" style={{ maxWidth: "760px" }}>
        <p className="eyebrow">ARTICLE</p>
        <h1 className="headline" style={{ fontSize: "var(--fs-display)", margin: "var(--sp-4) 0 var(--sp-5)" }}>
          {post.title}
        </h1>
        {post.publishedAt && (
          <p className="meta" style={{ marginBottom: "var(--sp-7)" }}>
            {new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}

        <TipTapRenderer document={post.content} />

        {relatedPosts.length > 0 && (
          <div style={{ marginTop: "var(--sp-9)", borderTop: "var(--border-thin) solid var(--rule-on-cream)", paddingTop: "var(--sp-6)" }}>
            <p className="eyebrow">RELATED</p>
            <ul>
              {relatedPosts.map((p) => (
                <li key={p.id}>
                  <a href={`/blog/${p.slug}`}>{p.title}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(post, settings)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([{ name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${slug}` }])),
        }}
      />
      <BlogViewTracker slug={slug} />
    </article>
  );
}
