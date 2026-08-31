"use client";

import { SimpleEditor } from "./tiptap-templates/simple/components/simple-editor";

/**
 * Thin re-export so callers don't need to know this is now backed by
 * Tiptap's official "simple-editor" template rather than a hand-rolled
 * toolbar — swapping the underlying editor shouldn't ripple through every
 * page that just wants a content/onChange rich-text box.
 */
export function TipTapEditor({
  content,
  onChange,
  format,
}: {
  content: unknown;
  onChange: (doc: unknown) => void;
  format?: "json" | "html";
}) {
  return <SimpleEditor content={content} onChange={onChange} format={format} />;
}
