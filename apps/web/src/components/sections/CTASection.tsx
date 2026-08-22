import type { CtaContent } from "@renas/shared";

export function CTASection({ content }: { content: unknown }) {
  const c = content as CtaContent;
  return (
    <section className="section section--teal" data-theme-bg="teal">
      <div className="container" style={{ textAlign: "center" }}>
        {c.eyebrow && (
          <p className="eyebrow" style={{ color: "var(--cream)" }}>
            {c.eyebrow}
          </p>
        )}
        <h2 className="headline" style={{ fontSize: "var(--fs-display)", margin: "var(--sp-4) auto var(--sp-4)", maxWidth: "20ch" }}>
          {c.headline}
        </h2>
        {c.body && (
          <p className="body-lg" style={{ margin: "0 auto var(--sp-7)" }}>
            {c.body}
          </p>
        )}
        <div style={{ display: "flex", gap: "var(--sp-5)", justifyContent: "center", flexWrap: "wrap" }}>
          <a href={c.primaryCta.href} className="btn btn--primary">
            {c.primaryCta.label} <span className="arrow">↗</span>
          </a>
          {c.secondaryCta && (
            <a href={c.secondaryCta.href} className="btn btn--ghost-light">
              {c.secondaryCta.label}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
