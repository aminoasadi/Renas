import type { NarrativeFeatureContent } from "@renas/shared";

export function NarrativeFeatureSection({ content }: { content: unknown }) {
  const c = content as NarrativeFeatureContent;

  return (
    <section className="section section--cream" data-theme-bg="cream">
      <div className="container">
        {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
        <h2 className="headline" style={{ fontSize: "var(--fs-h2)", margin: "var(--sp-4) 0 0", maxWidth: "24ch" }}>
          {c.headline}
        </h2>
        {c.standfirst && <p className="m-narrative__standfirst">{c.standfirst}</p>}

        <div className="m-narrative">
          {c.blocks.map((block, i) => {
            if (block.kind === "subheading") {
              return (
                <h3 key={i} className="m-narrative__block">
                  {block.text}
                </h3>
              );
            }
            if (block.kind === "pullquote") {
              return (
                <blockquote key={i} className="m-narrative__block">
                  <p>{block.text}</p>
                  {block.attribution && <footer>{block.attribution}</footer>}
                </blockquote>
              );
            }
            return (
              <p key={i} className="m-narrative__block">
                {block.text}
              </p>
            );
          })}
        </div>
      </div>
    </section>
  );
}
