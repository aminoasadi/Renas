import type { SupplySystemContent } from "@renas/shared";

export function SupplySystemSection({ content }: { content: unknown }) {
  const c = content as SupplySystemContent;
  const words = c.nodes.map((n) => n.label);

  return (
    <section
      className="m-system section--charcoal"
      id="system"
      aria-label="What RENAS handles"
      data-theme-bg="charcoal"
    >
      <div className="m-system__sticky">
        {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
        <h2 className="m-system__fixed headline">{c.headline}</h2>

        {/* The reel is decorative — the real, always-legible copy is the
            sr-only sentence below, so screen readers get the full list
            rather than whatever word happens to be centered. */}
        <div className="m-system__reel-viewport" aria-hidden="true">
          <div className="m-system__reel" id="systemReel">
            {words.map((w, i) => (
              <div key={c.nodes[i].key} className="m-system__reel-item">
                {w}.
              </div>
            ))}
          </div>
        </div>

        {c.centerSubLabel && <p className="m-system__caption meta">{c.centerSubLabel}</p>}
      </div>
      <p className="sr-only">
        {c.headline} {words.join(", ")}.
      </p>
    </section>
  );
}
