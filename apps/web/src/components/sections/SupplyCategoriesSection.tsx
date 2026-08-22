import type { SupplyCategoriesContent } from "@renas/shared";

export function SupplyCategoriesSection({ content }: { content: unknown }) {
  const c = content as SupplyCategoriesContent;
  return (
    <section className="section section--cream" data-theme-bg="cream">
      <div className="container">
        {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
        <h2 className="headline" style={{ fontSize: "var(--fs-h2)", margin: "var(--sp-4) 0 var(--sp-8)" }}>
          {c.headline}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "var(--grid-gap)",
          }}
        >
          {c.items.map((item, i) => (
            <article key={i} style={{ borderTop: "var(--border-thin) solid var(--rule-on-cream)", paddingTop: "var(--sp-5)" }}>
              {item.media && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.media.url}
                  alt={item.media.alt ?? ""}
                  loading="lazy"
                  style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", marginBottom: "var(--sp-4)" }}
                />
              )}
              <h3 style={{ fontSize: "var(--fs-h3)", marginBottom: "var(--sp-2)" }}>{item.title}</h3>
              {item.description && <p className="body-lg">{item.description}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
