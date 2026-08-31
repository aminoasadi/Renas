import type { HeavyVehicleFocusContent } from "@renas/shared";

export function HeavyVehicleSection({ content }: { content: unknown }) {
  const c = content as HeavyVehicleFocusContent;
  return (
    <section className="m-heavy" id="heavy-vehicle" aria-label="Heavy vehicle focus" data-theme-bg="charcoal">
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
        {c.subheadline && <p className="m-heavy__sub">{c.subheadline}</p>}
        {c.body && <p className="body-lg">{c.body}</p>}
        {c.cta && (
          <a href={c.cta.href} className="btn btn--primary">
            {c.cta.label} <span className="arrow">↗</span>
          </a>
        )}
      </div>
    </section>
  );
}
