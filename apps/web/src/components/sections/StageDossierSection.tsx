import type { StageDossierContent } from "@renas/shared";

export function StageDossierSection({ content }: { content: unknown }) {
  const c = content as StageDossierContent;

  return (
    <section className="section section--charcoal" data-theme-bg="charcoal">
      <div className="container">
        {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
        <h2 className="headline" style={{ fontSize: "var(--fs-h2)", margin: "var(--sp-4) 0 var(--sp-4)", maxWidth: "26ch" }}>
          {c.headline}
        </h2>
        {c.intro && <p className="m-stagedossier__intro body-lg">{c.intro}</p>}

        <div className="m-stagedossier__list">
          {c.stages.map((stage) => (
            <div key={stage.number} className="m-stagedossier__stage">
              <span className="m-stagedossier__num">{stage.number}</span>
              <div className="m-stagedossier__head">
                <h3>{stage.title}</h3>
                {stage.duration && <span className="m-stagedossier__duration">{stage.duration}</span>}
              </div>
              <p className="m-stagedossier__body">{stage.body}</p>

              {(stage.inputs?.length || stage.outputs?.length) && (
                <div className="m-stagedossier__io">
                  {stage.inputs && stage.inputs.length > 0 && (
                    <div className="m-stagedossier__io-col">
                      <h4>{stage.inputsTitle ?? "WHAT WE NEED"}</h4>
                      <ul>
                        {stage.inputs.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {stage.outputs && stage.outputs.length > 0 && (
                    <div className="m-stagedossier__io-col">
                      <h4>{stage.outputsTitle ?? "WHAT YOU GET"}</h4>
                      <ul>
                        {stage.outputs.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {c.closingNote && <p className="m-stagedossier__closing">{c.closingNote}</p>}
      </div>
    </section>
  );
}
