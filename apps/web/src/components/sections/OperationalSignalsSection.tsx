import type { OperationalSignalsContent } from "@renas/shared";

export function OperationalSignalsSection({ content }: { content: unknown }) {
  const c = content as OperationalSignalsContent;
  return (
    <section className="m-signals section--charcoal" data-theme-bg="charcoal">
      <div className="container">
        {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
        <h2 className="m-signals__headline headline">{c.headline}</h2>
      </div>

      <div className="m-signals__field">
        {c.signals.map((signal) => (
          <span key={signal.key} className="m-signal" data-signal={signal.key} data-description={signal.description}>
            {signal.label}
          </span>
        ))}
        {c.centerLine && (
          <div className="m-signals__center">
            <p>{c.centerLine}</p>
          </div>
        )}
      </div>
      <p className="m-signals__explain" id="signalsExplain" aria-live="polite">
        &nbsp;
      </p>
    </section>
  );
}
