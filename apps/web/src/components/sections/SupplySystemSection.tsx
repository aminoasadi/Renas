import type { SupplySystemContent } from "@renas/shared";

export function SupplySystemSection({ content }: { content: unknown }) {
  const c = content as SupplySystemContent;
  const relations: Record<string, { connects: string[] }> = {};
  c.nodes.forEach((n) => {
    relations[n.key] = { connects: n.connects };
  });

  return (
    <section className="m-system section--charcoal" data-theme-bg="charcoal">
      <div className="container">
        {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
        <h2 className="m-system__title headline">{c.headline}</h2>
      </div>
      <div className="m-system__stage" id="systemStage" data-relations={JSON.stringify(relations)}>
        <svg className="m-system__lines" id="systemLines" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid meet" aria-hidden="true" />

        {c.nodes.map((node) => (
          <button
            key={node.key}
            className="m-node"
            data-node={node.key}
            style={{ ["--x" as string]: `${node.x}%`, ["--y" as string]: `${node.y}%` }}
          >
            {node.label}
          </button>
        ))}

        <div className="m-node m-node--center" id="systemCenter">
          <span className="m-node__wordmark">{c.centerLabel}</span>
          {c.centerSubLabel && <span className="m-node__label">{c.centerSubLabel}</span>}
        </div>

        {/* Hidden descriptions the motion layer reads via data-node-desc, keeping copy in the DOM (accessible, CMS-driven) instead of a hardcoded JS map. */}
        <div className="sr-only">
          {c.nodes.map((node) => (
            <span key={node.key} data-node-desc={node.key}>
              {node.description}
            </span>
          ))}
        </div>

        <p className="m-system__copy" id="systemCopy" data-default="Hover a node to see the relationships RENAS evaluates around it.">
          Hover a node to see the relationships RENAS evaluates around it.
        </p>
      </div>
    </section>
  );
}
