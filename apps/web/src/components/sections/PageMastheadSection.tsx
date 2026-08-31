import type { PageMastheadContent } from "@renas/shared";

export function PageMastheadSection({ content }: { content: unknown }) {
  const c = content as PageMastheadContent;
  const variantClass = c.variant !== "stacked" ? ` m-masthead--${c.variant}` : "";

  const points = c.summaryPoints && c.summaryPoints.length > 0 && (
    <ol className="m-masthead__points">
      {c.summaryPoints.map((point, i) => (
        <li key={i}>
          <span className="m-masthead__points-num">{String(i + 1).padStart(2, "0")}</span>
          <span>{point}</span>
        </li>
      ))}
    </ol>
  );

  const meta = c.meta && c.meta.length > 0 && (
    <dl className="m-masthead__meta">
      {c.meta.map((m, i) => (
        <div key={i}>
          <dt>{m.label}</dt>
          <dd>{m.value}</dd>
        </div>
      ))}
    </dl>
  );

  const cta = (c.primaryCta || c.secondaryCta) && (
    <div className="m-masthead__cta">
      {c.primaryCta && (
        <a href={c.primaryCta.href} className="btn btn--primary">
          {c.primaryCta.label} <span className="arrow">↗</span>
        </a>
      )}
      {c.secondaryCta && (
        <a href={c.secondaryCta.href} className="btn btn--ghost-dark">
          {c.secondaryCta.label} <span className="arrow">↓</span>
        </a>
      )}
    </div>
  );

  return (
    <section className={`m-masthead section--cream${variantClass}`} data-theme-bg="cream">
      <div className="container">
        <p className="eyebrow m-masthead__kicker">{c.kicker}</p>
        <h1 className="m-masthead__headline headline">{c.headline}</h1>

        {c.variant === "stacked" && (
          <>
            <p className="m-masthead__standfirst">{c.standfirst}</p>
            {c.intro && <p className="m-masthead__intro body-lg">{c.intro}</p>}
            {points}
            {meta}
            {cta}
          </>
        )}

        {c.variant === "split" && (
          <div className="m-masthead__grid">
            <div>
              {cta}
              {meta}
            </div>
            <div>
              <p className="m-masthead__standfirst">{c.standfirst}</p>
              {c.intro && <p className="m-masthead__intro body-lg">{c.intro}</p>}
              {points}
            </div>
          </div>
        )}

        {c.variant === "indexed" && (
          <>
            <p className="m-masthead__standfirst">{c.standfirst}</p>
            <div className="m-masthead__grid">
              <div>
                {c.intro && <p className="body-lg">{c.intro}</p>}
                {cta}
              </div>
              {points}
            </div>
            {meta}
          </>
        )}
      </div>
    </section>
  );
}
