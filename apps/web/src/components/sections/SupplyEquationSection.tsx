import { Fragment } from "react";
import type { SupplyEquationContent } from "@renas/shared";

export function SupplyEquationSection({ content }: { content: unknown }) {
  const c = content as SupplyEquationContent;
  return (
    <section className="m-equation section--cream" id="equation" aria-label="The supply equation" data-theme-bg="cream">
      <div className="m-equation__sticky">
        <div className="container">
          {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
          <div className="m-equation__terms">
            {c.terms.map((t, i) => (
              <Fragment key={t.term}>
                {i > 0 && <span className="m-eq-op">{t.isResult ? "=" : "+"}</span>}
                <button
                  className={`m-eq-term${t.isResult ? " m-eq-term--result" : ""}`}
                  data-term={t.term}
                  data-copy={t.copy}
                >
                  {t.label}
                </button>
              </Fragment>
            ))}
          </div>
          <div className="m-equation__reveal" id="equationReveal" aria-live="polite">
            <p className="m-equation__reveal-text">{c.terms[0]?.copy}</p>
          </div>
          {c.footNote && <p className="m-equation__foot">{c.footNote}</p>}
        </div>
      </div>
    </section>
  );
}
