import type { EditorialDossierContent } from "@renas/shared";

export function EditorialDossierSection({ content }: { content: unknown }) {
  const c = content as EditorialDossierContent;

  return (
    <section className="section section--cream" data-theme-bg="cream">
      <div className="container">
        {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
        <h2 className="headline" style={{ fontSize: "var(--fs-h2)", margin: "var(--sp-4) 0 var(--sp-4)" }}>
          {c.headline}
        </h2>
        {c.intro && <p className="m-dossier__intro body-lg">{c.intro}</p>}

        <div className="m-dossier__grid">
          <nav className="m-dossier__toc" aria-label="Contents">
            <p className="m-dossier__toc-label">{c.contentsLabel ?? "CONTENTS"}</p>
            <ol>
              {c.chapters.map((chapter) => (
                <li key={chapter.id}>
                  <a href={`#${chapter.id}`}>
                    <span className="m-dossier__toc-num">{chapter.number}</span>
                    <span>{chapter.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="m-dossier__chapters">
            {c.chapters.map((chapter) => (
              <article key={chapter.id} id={chapter.id} className="m-dossier__chapter">
                <div className="m-dossier__chapter-head">
                  <span className="m-dossier__chapter-num">{chapter.number}</span>
                  <h2>{chapter.title}</h2>
                </div>
                {chapter.body.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
                {chapter.keyPoints && chapter.keyPoints.length > 0 && (
                  <>
                    {chapter.keyPointsTitle && <h4>{chapter.keyPointsTitle}</h4>}
                    <ul>
                      {chapter.keyPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
