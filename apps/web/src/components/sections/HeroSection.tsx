import type { HeroContent } from "@renas/shared";

const gridClasses = ["m-hero__img--a", "m-hero__img--b", "m-hero__img--c"];

export function HeroSection({ content }: { content: unknown }) {
  const c = content as HeroContent;
  return (
    <section className="m-hero" id="top" aria-label="Introduction" data-theme-bg="charcoal">
      <div className="m-hero__grid">
        {c.images.map((img, i) => (
          <figure key={img.media.id} className={`m-hero__img ${gridClasses[i] ?? ""}`} data-meta={img.metaLabel ?? ""}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.media.url} alt={img.media.alt ?? ""} loading="eager" />
          </figure>
        ))}

        <div className="m-hero__type">
          <p className="m-hero__eyebrow">{c.eyebrow}</p>
          <h1 className="m-hero__headline">
            {c.headlineLines.map((line, i) => (
              <span
                key={i}
                className={`m-hero__line${i === c.headlineLines.length - 1 ? " m-hero__line--accent" : ""}`}
                data-word={line}
              >
                {line}
              </span>
            ))}
          </h1>
          {c.supportingLine && <p className="m-hero__alt">{c.supportingLine}</p>}
          {c.intro && <p className="m-hero__intro">{c.intro}</p>}
          <div className="m-hero__cta">
            {c.primaryCta && (
              <a href={c.primaryCta.href} className="btn btn--primary">
                {c.primaryCta.label} <span className="arrow">↗</span>
              </a>
            )}
            {c.secondaryCta && (
              <a href={c.secondaryCta.href} className="btn btn--ghost-light">
                {c.secondaryCta.label} <span className="arrow">↓</span>
              </a>
            )}
          </div>
        </div>

        <div className="m-hero__gold-line" aria-hidden="true" />
        <div className="m-hero__cursor-meta" id="heroCursorMeta" aria-hidden="true" />
      </div>
    </section>
  );
}
