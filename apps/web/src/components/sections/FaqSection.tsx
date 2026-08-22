import type { FaqContent } from "@renas/shared";

export function FaqSection({ content }: { content: unknown }) {
  const c = content as FaqContent;
  return (
    <section className="section section--cream" data-theme-bg="cream">
      <div className="container">
        {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
        <h2 className="headline" style={{ fontSize: "var(--fs-h2)", margin: "var(--sp-4) 0 var(--sp-8)" }}>
          {c.headline}
        </h2>
        <div>
          {c.items.map((item, i) => (
            <details key={i} style={{ borderTop: "var(--border-thin) solid var(--rule-on-cream)", paddingBlock: "var(--sp-5)" }}>
              <summary style={{ cursor: "pointer", fontSize: "var(--fs-h3)", fontWeight: 500 }}>{item.question}</summary>
              <p className="body-lg" style={{ marginTop: "var(--sp-3)" }}>
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
