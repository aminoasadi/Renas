import type { DecisionLayerContent } from "@renas/shared";

export function DecisionLayerSection({ content }: { content: unknown }) {
  const c = content as DecisionLayerContent;
  return (
    <section className="m-decision section--teal" id="decision" aria-label="Decision layer" data-theme-bg="teal">
      <div className="container m-decision__grid">
        <div className="m-decision__sticky">
          {c.eyebrow && (
            <p className="eyebrow" style={{ color: "var(--cream)" }}>
              {c.eyebrow}
            </p>
          )}
          <p className="m-decision__bigword" id="decisionBigword">
            {c.factors[0]?.bigWord}
          </p>
          <h2 className="m-decision__headline headline">{c.headline}</h2>
          {c.supportingLine && <p className="body-lg">{c.supportingLine}</p>}
        </div>

        <div className="m-decision__scroll">
          {c.factors.map((factor) => (
            <article key={factor.index} className="m-decision__factor" data-word={factor.bigWord}>
              <p className="m-decision__num num-index">{factor.index}</p>
              <h3 className="m-decision__factor-title">{factor.title}</h3>
              <p>{factor.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
