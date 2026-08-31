import type { Metadata } from "next";
import Link from "next/link";
import { listBlogPosts } from "@/lib/api";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

const PER_PAGE = 9;

const COPY = {
  en: {
    title: "Blog",
    eyebrow: "JOURNAL",
    headline: "Notes on industrial supply.",
    noEntries: "NO ENTRIES",
    entry: "ENTRY",
    entries: "ENTRIES",
    page: (p: number, total: number) => ` / PAGE ${p} OF ${total}`,
    searchLabel: "Search articles",
    searchPlaceholder: "SEARCH ARTICLES",
    noMatch: (q: string) => `No articles match “${q}”.`,
    empty: "No articles published yet — the first entries are being written.",
    latest: "LATEST",
    pagination: "Pagination",
  },
  fa: {
    title: "بلاگ",
    eyebrow: "مجله",
    headline: "یادداشت‌هایی درباره تأمین صنعتی.",
    noEntries: "بدون مطلب",
    entry: "مطلب",
    entries: "مطلب",
    page: (p: number, total: number) => ` / صفحه ${p} از ${total}`,
    searchLabel: "جستجوی مقالات",
    searchPlaceholder: "جستجوی مقالات",
    noMatch: (q: string) => `مطلبی برای «${q}» پیدا نشد.`,
    empty: "هنوز مطلبی منتشر نشده — اولین یادداشت‌ها در حال نوشته‌شدن هستند.",
    latest: "آخرین",
    pagination: "صفحه‌بندی",
  },
};

function formatDate(value: string, locale: Locale) {
  return new Date(value)
    .toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US", { year: "numeric", month: "short", day: "2-digit" })
    .toUpperCase();
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  return { title: COPY[locale].title };
}

export default async function BlogIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; category?: string; tag?: string; search?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = COPY[locale];
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const { items, total } = await listBlogPosts({
    locale,
    page,
    perPage: PER_PAGE,
    category: sp.category,
    tag: sp.tag,
    search: sp.search,
  });
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  // The lead article gets display-scale treatment; the rest read as a
  // numbered index. Only promote a lead on the unfiltered first page —
  // on page 2, or within a search, there is no "latest" to feature.
  const isFirstUnfiltered = page === 1 && !sp.search && !sp.category && !sp.tag;
  const [lead, ...rest] = items;
  const showLead = isFirstUnfiltered && Boolean(lead);
  const listed = showLead ? rest : items;
  // Keep numbering continuous across pages and correct when a lead was lifted out.
  const numberOffset = (page - 1) * PER_PAGE + (showLead ? 1 : 0);

  return (
    <section className="section section--cream" data-theme-bg="cream">
      <div className="container">
        <header className="m-journal__head">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 className="m-journal__headline headline">{t.headline}</h1>
          </div>
          <p className="meta">
            {total === 0 ? t.noEntries : `${String(total).padStart(2, "0")} ${total === 1 ? t.entry : t.entries}`}
            {totalPages > 1 ? t.page(page, totalPages) : ""}
          </p>
        </header>

        <form method="get" className="m-journal__search" role="search">
          <label className="sr-only" htmlFor="journal-search">
            {t.searchLabel}
          </label>
          <input id="journal-search" type="search" name="search" placeholder={t.searchPlaceholder} defaultValue={sp.search} />
        </form>

        {items.length === 0 && <p className="body-lg">{sp.search ? t.noMatch(sp.search) : t.empty}</p>}

        {showLead && lead && (
          <Link href={`/${locale}/blog/${lead.slug}`} className="m-journal__lead">
            {lead.coverImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={lead.coverImage.url} alt={lead.coverImage.alt ?? ""} className="m-journal__lead-cover" />
            )}
            <div className="m-journal__lead-meta">
              <span className="meta">{t.latest}</span>
              {lead.publishedAt && <span className="meta">{formatDate(lead.publishedAt, locale)}</span>}
            </div>
            <h2 className="m-journal__lead-title">{lead.title}</h2>
            {lead.excerpt && <p className="m-journal__lead-excerpt">{lead.excerpt}</p>}
          </Link>
        )}

        {listed.length > 0 && (
          <div className="m-journal__list">
            {listed.map((post, i) => (
              <Link key={post.id} href={`/${locale}/blog/${post.slug}`}>
                <article className="m-journal__item">
                  <span className="m-journal__num">{String(numberOffset + i + 1).padStart(2, "0")}</span>
                  {post.coverImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={post.coverImage.url} alt={post.coverImage.alt ?? ""} className="m-journal__thumb" />
                  ) : (
                    <span className="m-journal__thumb m-journal__thumb--empty" aria-hidden="true" />
                  )}
                  <div>
                    <h2 className="m-journal__title">{post.title}</h2>
                    {post.excerpt && <p className="m-journal__excerpt">{post.excerpt}</p>}
                  </div>
                  <span className="m-journal__date">{post.publishedAt ? formatDate(post.publishedAt, locale) : ""}</span>
                </article>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav aria-label={t.pagination} className="m-journal__pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={`/${locale}/blog?page=${p}`} className="btn btn--ghost-dark" aria-current={p === page ? "page" : undefined}>
                {String(p).padStart(2, "0")}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
