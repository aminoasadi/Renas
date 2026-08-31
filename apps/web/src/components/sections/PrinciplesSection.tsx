import type { PrinciplesContent } from "@renas/shared";

export function PrinciplesSection({ content }: { content: unknown }) {
  const c = content as PrinciplesContent;
  return (
    <section className="m-principle section--cream" id="about" aria-label="The RENAS principle" data-theme-bg="cream">
      <div className="container">
        {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
        <h2 className="m-principle__headline headline">{c.headline}</h2>

        <div className="m-principle__list">
          {c.items.map((item) => (
            <article key={item.index} className="m-principle__item">
              <span className="m-principle__num">{item.index}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </article>
          ))}
        </div>

        {c.closingLine && <p className="m-principle__final">{c.closingLine}</p>}
      </div>
    </section>
  );
}
