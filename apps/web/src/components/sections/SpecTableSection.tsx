import type { SpecTableContent } from "@renas/shared";

export function SpecTableSection({ content }: { content: unknown }) {
  const c = content as SpecTableContent;

  return (
    <section className="section section--cream" data-theme-bg="cream">
      <div className="container">
        {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
        <h2 className="headline" style={{ fontSize: "var(--fs-h2)", margin: "var(--sp-4) 0 var(--sp-4)" }}>
          {c.headline}
        </h2>
        {c.intro && <p className="m-spectable__intro body-lg">{c.intro}</p>}

        {c.groups.map((group) => {
          const cols = group.columns;
          const hasNoteColumn = group.rows.some((row) => row.note !== undefined);
          return (
            <div key={group.id} id={group.id} className="m-spectable__group">
              <div className="m-spectable__group-head">
                {group.number && <span className="m-spectable__group-num">{group.number}</span>}
                <h3>{group.title}</h3>
              </div>
              {group.description && <p className="m-spectable__group-desc">{group.description}</p>}

              <div style={{ overflowX: "auto" }}>
                <table className="m-spectable__table">
                  <thead>
                    <tr>
                      <th>{cols?.term ?? "TERM"}</th>
                      <th>{cols?.detail ?? "WHAT IT MEANS"}</th>
                      {hasNoteColumn && <th>{cols?.note ?? ""}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row, i) => (
                      <tr key={i}>
                        <td>{row.term}</td>
                        <td>{row.detail}</td>
                        {hasNoteColumn && <td>{row.note}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {c.footNote && <p className="m-spectable__foot">{c.footNote}</p>}
      </div>
    </section>
  );
}
