import sanitizeHtml from "sanitize-html";

/**
 * The only place raw CMS-authored HTML (the `rich_text` section type) is
 * allowed to reach the DOM, and only after stripping anything that isn't
 * on this allowlist — scripts, event handler attributes, iframes, style
 * tags, everything. CMS content is trusted to come from an authorized
 * editor, not from the public, but it still isn't trusted to be safe HTML:
 * an editor pasting from Word or a compromised admin session shouldn't be
 * able to inject a script tag into every page that embeds it.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
      "h2", "h3", "h4", "blockquote", "code", "pre", "hr",
      "table", "thead", "tbody", "tr", "th", "td", "figure", "figcaption", "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
