import type { Metadata } from "next";
import Link from "next/link";
import { listBlogPosts, getSettings } from "@/lib/api";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; tag?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const [{ items, total }, settings] = await Promise.all([
    listBlogPosts({ page, perPage: 9, category: params.category, tag: params.tag, search: params.search }),
    getSettings(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / 9));

  return (
    <section className="section section--cream" data-theme-bg="cream">
      <div className="container">
        <p className="eyebrow">INSIGHTS</p>
        <h1 className="headline" style={{ fontSize: "var(--fs-display)", margin: "var(--sp-4) 0 var(--sp-8)" }}>
          {settings.companyName} Blog
        </h1>

        <form method="get" style={{ marginBottom: "var(--sp-8)" }}>
          <input
            className="m-composer__input"
            style={{ color: "var(--charcoal)", borderColor: "var(--rule-on-cream)", maxWidth: "360px" }}
            type="search"
            name="search"
            placeholder="Search articles…"
            defaultValue={params.search}
          />
        </form>

        {items.length === 0 && <p className="body-lg">No articles published yet.</p>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--grid-gap)" }}>
          {items.map((post) => (
            <article key={post.id} style={{ borderTop: "var(--border-thin) solid var(--rule-on-cream)", paddingTop: "var(--sp-5)" }}>
              <Link href={`/blog/${post.slug}`}>
                <h2 style={{ fontSize: "var(--fs-h3)", marginBottom: "var(--sp-3)" }}>{post.title}</h2>
              </Link>
              {post.excerpt && <p className="body-lg">{post.excerpt}</p>}
              {post.publishedAt && (
                <p className="meta" style={{ marginTop: "var(--sp-3)" }}>
                  {new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </article>
          ))}
        </div>

        {totalPages > 1 && (
          <nav aria-label="Pagination" style={{ display: "flex", gap: "var(--sp-4)", marginTop: "var(--sp-8)" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={`/blog?page=${p}`} className="btn btn--ghost-dark" aria-current={p === page ? "page" : undefined}>
                {p}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
