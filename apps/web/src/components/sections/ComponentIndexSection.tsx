import type { ComponentIndexContent } from "@renas/shared";

export function ComponentIndexSection({ content }: { content: unknown }) {
  const c = content as ComponentIndexContent;
  return (
    <section className="m-index section--cream" data-theme-bg="cream">
      <div className="container">
        {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
        <h2 className="m-index__title headline">{c.headline}</h2>

        <div className="m-index__body">
          <div className="m-index__left">
            <ul className="m-index__list" role="tablist" aria-label="Component categories">
              {c.items.map((item, i) => (
                <li key={item.number}>
                  <button
                    className={`m-index__item${i === 0 ? " is-active" : ""}`}
                    role="tab"
                    aria-selected={i === 0}
                    data-cat={item.number}
                    data-sys={item.label}
                  >
                    <span className="num-index">{item.number}</span> {item.label}
                  </button>
                </li>
              ))}
            </ul>
            {c.cta && (
              <a href={c.cta.href} className="btn btn--primary m-index__cta">
                {c.cta.label} <span className="arrow">→</span>
              </a>
            )}
          </div>

          <div className="m-index__stage" id="indexStage">
            {c.items.map((item, i) => (
              <figure key={item.number} className={`m-index__image${i === 0 ? " is-active" : ""}`} data-cat={item.number}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.media.url} alt={item.media.alt ?? ""} loading="lazy" />
              </figure>
            ))}
            <div className="m-index__meta">
              <span id="idxMetaCat">CATEGORY / {c.items[0]?.number}</span>
              <span id="idxMetaSys">SYSTEM / {c.items[0]?.label}</span>
              {c.items[0]?.metaLines?.map((line, i) => <span key={i}>{line}</span>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
