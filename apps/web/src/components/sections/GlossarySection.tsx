import type { GlossaryContent } from "@renas/shared";

export function GlossarySection({ content }: { content: unknown }) {
  const c = content as GlossaryContent;

  return (
    <section className="section section--charcoal" data-theme-bg="charcoal">
      <div className="container">
        {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
        <h2 className="headline" style={{ fontSize: "var(--fs-h2)", margin: "var(--sp-4) 0 var(--sp-4)" }}>
          {c.headline}
        </h2>
        {c.intro && <p className="m-glossary__intro body-lg">{c.intro}</p>}

        <dl>
          {c.entries.map((entry, i) => (
            <div key={i} className="m-glossary__entry">
              <dt>
                {entry.term}
                {entry.aka && entry.aka.length > 0 && <span className="m-glossary__aka">ALSO: {entry.aka.join(" · ")}</span>}
              </dt>
              <dd>{entry.definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
