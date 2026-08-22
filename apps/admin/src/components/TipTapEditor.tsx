"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import { MediaPickerModal } from "./MediaPicker";
import { useState } from "react";

/**
 * Stores TipTap's structured JSON document (`editor.getJSON()`), never raw
 * HTML — the frontend renders that JSON through its own fixed node-type
 * switch (`TipTapRenderer`) rather than trusting/injecting HTML strings.
 * See docs/security.md.
 */
export function TipTapEditor({ content, onChange }: { content: unknown; onChange: (doc: unknown) => void }) {
  const [showImagePicker, setShowImagePicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: "Write your article…" }),
    ],
    content: (content as object) ?? "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  useEffect(() => {
    return () => editor?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!editor) return null;

  return (
    <div>
      <div className="tiptap-toolbar">
        <button type="button" className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <button type="button" className={editor.isActive("heading", { level: 4 }) ? "is-active" : ""} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>H4</button>
        <button type="button" className={editor.isActive("bold") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></button>
        <button type="button" className={editor.isActive("italic") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></button>
        <button type="button" className={editor.isActive("bulletList") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button type="button" className={editor.isActive("orderedList") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
        <button type="button" className={editor.isActive("blockquote") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</button>
        <button type="button" className={editor.isActive("codeBlock") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code</button>
        <button
          type="button"
          className={editor.isActive("link") ? "is-active" : ""}
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          Link
        </button>
        <button type="button" onClick={() => setShowImagePicker(true)}>Image</button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          Table
        </button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}>Divider</button>
      </div>
      <EditorContent editor={editor} />

      {showImagePicker && (
        <MediaPickerModal
          onSelect={(asset) => {
            editor.chain().focus().setImage({ src: asset.publicUrl, alt: asset.alt ?? "" }).run();
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}
