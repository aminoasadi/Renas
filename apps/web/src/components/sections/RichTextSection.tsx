import type { RichTextContent } from "@renas/shared";
import { sanitizeRichText } from "@/lib/sanitize";

export function RichTextSection({ content }: { content: unknown }) {
  const c = content as RichTextContent;
  const safeHtml = sanitizeRichText(c.html);
  return (
    <section className="section section--cream" data-theme-bg="cream">
      <div className="container m-article-body" dangerouslySetInnerHTML={{ __html: safeHtml }} />
    </section>
  );
}
