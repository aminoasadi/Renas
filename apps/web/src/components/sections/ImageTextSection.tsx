import type { ImageTextContent } from "@renas/shared";

export function ImageTextSection({ content }: { content: unknown }) {
  const c = content as ImageTextContent;
  return (
    <section className="section section--cream" data-theme-bg="cream">
      <div
        className="container"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--sp-8)",
          alignItems: "center",
        }}
      >
        <figure style={{ margin: 0, order: c.mediaPosition === "right" ? 2 : 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.media.url} alt={c.media.alt ?? ""} loading="lazy" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} />
        </figure>
        <div style={{ order: c.mediaPosition === "right" ? 1 : 2 }}>
          <h2 style={{ fontSize: "var(--fs-h2)", marginBottom: "var(--sp-4)" }}>{c.headline}</h2>
          <p className="body-lg">{c.body}</p>
        </div>
      </div>
    </section>
  );
}
