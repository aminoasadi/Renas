import type { CapabilityContent } from "@renas/shared";

export function CapabilitySection({ content }: { content: unknown }) {
  const c = content as CapabilityContent;
  return (
    <section className="m-heavy" data-theme-bg="charcoal">
      <figure className="m-heavy__img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.media.url} alt={c.media.alt ?? ""} loading="lazy" />
      </figure>
      {c.overlayLabels && c.overlayLabels.length > 0 && (
        <div className="m-heavy__overlay">
          {c.overlayLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      )}
      <div className="container m-heavy__content">
        <h2 className="m-heavy__headline headline">{c.headline}</h2>
        {c.supportingLine && <p className="m-heavy__sub">{c.supportingLine}</p>}
        {c.cta && (
          <a href={c.cta.href} className="btn btn--primary">
            {c.cta.label} <span className="arrow">↗</span>
          </a>
        )}
      </div>
    </section>
  );
}
