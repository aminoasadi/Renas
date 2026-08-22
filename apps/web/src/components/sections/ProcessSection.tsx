import type { ProcessContent } from "@renas/shared";

export function ProcessSection({ content }: { content: unknown }) {
  const c = content as ProcessContent;
  return (
    <section className="section section--cream" data-theme-bg="cream">
      <div className="container">
        {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
        <h2 className="headline" style={{ fontSize: "var(--fs-h2)", margin: "var(--sp-4) 0 var(--sp-8)" }}>
          {c.headline}
        </h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {c.steps.map((step) => (
            <article
              key={step.index}
              style={{
                display: "grid",
                gridTemplateColumns: "96px 1fr",
                gap: "var(--sp-6)",
                borderTop: "var(--border-thin) solid var(--rule-on-cream)",
                paddingBlock: "var(--sp-6)",
              }}
            >
              <span className="num-index" style={{ fontSize: "32px" }}>
                {step.index}
              </span>
              <div>
                <h3 style={{ fontSize: "var(--fs-h3)", marginBottom: "var(--sp-2)" }}>{step.title}</h3>
                <p className="body-lg">{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
