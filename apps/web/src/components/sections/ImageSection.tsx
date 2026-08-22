import type { ImageContent } from "@renas/shared";

export function ImageSection({ content }: { content: unknown }) {
  const c = content as ImageContent;
  return (
    <figure style={{ margin: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.media.url} alt={c.media.alt ?? ""} loading="lazy" style={{ width: "100%", display: "block" }} />
      {c.caption && (
        <figcaption className="meta container" style={{ paddingBlock: "var(--sp-3)" }}>
          {c.caption}
        </figcaption>
      )}
    </figure>
  );
}
