"use client";

import { useState } from "react";
import { Field, TextInput, TextAreaInput, MediaField, CtaEditor, ArrayEditor, type CtaValue } from "./shared";

type AnyContent = Record<string, any>;

export function SectionEditorForm({ type, content, onChange }: { type: string; content: AnyContent; onChange: (content: AnyContent) => void }) {
  const [showRaw, setShowRaw] = useState(false);
  const set = (patch: Partial<AnyContent>) => onChange({ ...content, ...patch });

  return (
    <div>
      {renderByType(type, content, set)}

      <details style={{ marginTop: 16 }} open={showRaw} onToggle={(e) => setShowRaw((e.target as HTMLDetailsElement).open)}>
        <summary className="meta" style={{ cursor: "pointer" }}>
          Advanced: raw JSON
        </summary>
        <RawJsonEditor content={content} onChange={onChange} />
      </details>
    </div>
  );
}

function RawJsonEditor({ content, onChange }: { content: AnyContent; onChange: (content: AnyContent) => void }) {
  const [text, setText] = useState(() => JSON.stringify(content, null, 2));
  const [error, setError] = useState("");

  return (
    <div style={{ marginTop: 8 }}>
      <textarea
        className="admin-textarea"
        style={{ fontFamily: "monospace", fontSize: 12, minHeight: 160 }}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setError("");
          } catch {
            setError("Invalid JSON — not saved until this is fixed.");
          }
        }}
      />
      {error && <p className="admin-error-text">{error}</p>}
    </div>
  );
}

function headlineLinesEditor(lines: string[], onChange: (lines: string[]) => void) {
  return (
    <Field label="Headline lines" hint="One line per row — each renders on its own line.">
      {lines.map((line, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <TextInput
            value={line}
            onChange={(v) => {
              const next = lines.slice();
              next[i] = v;
              onChange(next);
            }}
          />
          <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => onChange(lines.filter((_, idx) => idx !== i))}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="admin-btn admin-btn--sm" onClick={() => onChange([...lines, ""])}>
        + Add line
      </button>
    </Field>
  );
}

function renderByType(type: string, c: AnyContent, set: (patch: Partial<AnyContent>) => void): React.ReactNode {
  switch (type) {
    case "hero":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          {headlineLinesEditor(c.headlineLines ?? [], (v) => set({ headlineLines: v }))}
          <Field label="Supporting line"><TextInput value={c.supportingLine ?? ""} onChange={(v) => set({ supportingLine: v })} /></Field>
          <Field label="Intro"><TextAreaInput value={c.intro ?? ""} onChange={(v) => set({ intro: v })} /></Field>
          <Field label="Images (up to 3)">
            <ArrayEditor<AnyContent>
              items={c.images ?? []}
              onChange={(v) => set({ images: v })}
              newItem={() => ({ media: null, metaLabel: "" })}
              itemLabel="Image"
              renderItem={(item, update) => (
                <>
                  <MediaField value={item.media} onChange={(m) => update({ media: m })} />
                  <Field label="Meta label"><TextInput value={item.metaLabel ?? ""} onChange={(v) => update({ metaLabel: v })} /></Field>
                </>
              )}
            />
          </Field>
          <CtaEditor label="Primary CTA" value={c.primaryCta} onChange={(v: CtaValue | undefined) => set({ primaryCta: v })} />
          <CtaEditor label="Secondary CTA" value={c.secondaryCta} onChange={(v: CtaValue | undefined) => set({ secondaryCta: v })} />
        </>
      );

    case "rich_text":
      return (
        <Field label="Content (HTML)" hint="Sanitized before rendering — only a safe tag allowlist is preserved.">
          <TextAreaInput value={c.html ?? ""} onChange={(v) => set({ html: v })} rows={8} />
        </Field>
      );

    case "process":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Steps">
            <ArrayEditor<AnyContent>
              items={c.steps ?? []}
              onChange={(v) => set({ steps: v })}
              newItem={() => ({ index: "01", title: "", body: "" })}
              itemLabel="Step"
              renderItem={(item, update) => (
                <>
                  <Field label="Index"><TextInput value={item.index} onChange={(v) => update({ index: v })} /></Field>
                  <Field label="Title"><TextInput value={item.title} onChange={(v) => update({ title: v })} /></Field>
                  <Field label="Body"><TextAreaInput value={item.body} onChange={(v) => update({ body: v })} /></Field>
                </>
              )}
            />
          </Field>
        </>
      );

    case "supply_categories":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Items">
            <ArrayEditor<AnyContent>
              items={c.items ?? []}
              onChange={(v) => set({ items: v })}
              newItem={() => ({ title: "", description: "", media: null })}
              itemLabel="Item"
              renderItem={(item, update) => (
                <>
                  <Field label="Title"><TextInput value={item.title} onChange={(v) => update({ title: v })} /></Field>
                  <Field label="Description"><TextAreaInput value={item.description ?? ""} onChange={(v) => update({ description: v })} /></Field>
                  <MediaField value={item.media} onChange={(m) => update({ media: m })} />
                </>
              )}
            />
          </Field>
        </>
      );

    case "supply_system":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Center label"><TextInput value={c.centerLabel ?? ""} onChange={(v) => set({ centerLabel: v })} /></Field>
          <Field label="Center sub-label"><TextInput value={c.centerSubLabel ?? ""} onChange={(v) => set({ centerSubLabel: v })} /></Field>
          <Field label="Nodes" hint="x/y are percentages (0-100) positioning the node on the diagram. Connects: comma-separated node keys.">
            <ArrayEditor<AnyContent>
              items={c.nodes ?? []}
              onChange={(v) => set({ nodes: v })}
              newItem={() => ({ key: "", label: "", x: 50, y: 50, connects: [], description: "" })}
              itemLabel="Node"
              renderItem={(item, update) => (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <Field label="Key (unique)"><TextInput value={item.key} onChange={(v) => update({ key: v })} /></Field>
                    <Field label="Label"><TextInput value={item.label} onChange={(v) => update({ label: v })} /></Field>
                    <Field label="X %"><TextInput value={String(item.x)} onChange={(v) => update({ x: Number(v) || 0 })} /></Field>
                    <Field label="Y %"><TextInput value={String(item.y)} onChange={(v) => update({ y: Number(v) || 0 })} /></Field>
                  </div>
                  <Field label="Connects (comma-separated keys)">
                    <TextInput value={(item.connects ?? []).join(", ")} onChange={(v) => update({ connects: v.split(",").map((s: string) => s.trim()).filter(Boolean) })} />
                  </Field>
                  <Field label="Description"><TextAreaInput value={item.description} onChange={(v) => update({ description: v })} /></Field>
                </>
              )}
            />
          </Field>
        </>
      );

    case "component_index":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Items">
            <ArrayEditor<AnyContent>
              items={c.items ?? []}
              onChange={(v) => set({ items: v })}
              newItem={() => ({ number: "001", label: "", media: null, metaLines: [] })}
              itemLabel="Item"
              renderItem={(item, update) => (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
                    <Field label="Number"><TextInput value={item.number} onChange={(v) => update({ number: v })} /></Field>
                    <Field label="Label"><TextInput value={item.label} onChange={(v) => update({ label: v })} /></Field>
                  </div>
                  <MediaField value={item.media} onChange={(m) => update({ media: m })} />
                  <Field label="Meta lines (comma-separated)">
                    <TextInput value={(item.metaLines ?? []).join(", ")} onChange={(v) => update({ metaLines: v.split(",").map((s: string) => s.trim()).filter(Boolean) })} />
                  </Field>
                </>
              )}
            />
          </Field>
          <CtaEditor label="CTA" value={c.cta} onChange={(v: CtaValue | undefined) => set({ cta: v })} />
        </>
      );

    case "decision_layer":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Supporting line"><TextInput value={c.supportingLine ?? ""} onChange={(v) => set({ supportingLine: v })} /></Field>
          <Field label="Factors">
            <ArrayEditor<AnyContent>
              items={c.factors ?? []}
              onChange={(v) => set({ factors: v })}
              newItem={() => ({ index: "01", bigWord: "", title: "", body: "" })}
              itemLabel="Factor"
              renderItem={(item, update) => (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <Field label="Index"><TextInput value={item.index} onChange={(v) => update({ index: v })} /></Field>
                    <Field label="Big word (background)"><TextInput value={item.bigWord} onChange={(v) => update({ bigWord: v })} /></Field>
                  </div>
                  <Field label="Title"><TextInput value={item.title} onChange={(v) => update({ title: v })} /></Field>
                  <Field label="Body"><TextAreaInput value={item.body} onChange={(v) => update({ body: v })} /></Field>
                </>
              )}
            />
          </Field>
        </>
      );

    case "route_stories":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Supporting line"><TextInput value={c.supportingLine ?? ""} onChange={(v) => set({ supportingLine: v })} /></Field>
          <Field label="Route stories">
            <ArrayEditor<AnyContent>
              items={c.stories ?? []}
              onChange={(v) => set({ stories: v })}
              newItem={() => ({ label: "", title: "", body: "", media: null })}
              itemLabel="Route"
              renderItem={(item, update) => (
                <>
                  <Field label="Route label (e.g. SOURCE / EAST ASIA)"><TextInput value={item.label} onChange={(v) => update({ label: v })} /></Field>
                  <Field label="Title (e.g. CHINA → IRAN)"><TextInput value={item.title} onChange={(v) => update({ title: v })} /></Field>
                  <Field label="Description"><TextAreaInput value={item.body} onChange={(v) => update({ body: v })} /></Field>
                  <MediaField value={item.media} onChange={(m) => update({ media: m })} />
                </>
              )}
            />
          </Field>
        </>
      );

    case "operational_signals":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Center line"><TextInput value={c.centerLine ?? ""} onChange={(v) => set({ centerLine: v })} /></Field>
          <Field label="Signals">
            <ArrayEditor<AnyContent>
              items={c.signals ?? []}
              onChange={(v) => set({ signals: v })}
              newItem={() => ({ key: "", label: "", description: "" })}
              itemLabel="Signal"
              renderItem={(item, update) => (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <Field label="Key (unique)"><TextInput value={item.key} onChange={(v) => update({ key: v })} /></Field>
                    <Field label="Label"><TextInput value={item.label} onChange={(v) => update({ label: v })} /></Field>
                  </div>
                  <Field label="Description"><TextAreaInput value={item.description} onChange={(v) => update({ description: v })} /></Field>
                </>
              )}
            />
          </Field>
        </>
      );

    case "capability":
      return (
        <>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Supporting line"><TextInput value={c.supportingLine ?? ""} onChange={(v) => set({ supportingLine: v })} /></Field>
          <MediaField value={c.media} onChange={(m) => set({ media: m })} />
          <Field label="Overlay labels (comma-separated)">
            <TextInput value={(c.overlayLabels ?? []).join(", ")} onChange={(v) => set({ overlayLabels: v.split(",").map((s: string) => s.trim()).filter(Boolean) })} />
          </Field>
          <CtaEditor label="CTA" value={c.cta} onChange={(v: CtaValue | undefined) => set({ cta: v })} />
        </>
      );

    case "principles":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Items">
            <ArrayEditor<AnyContent>
              items={c.items ?? []}
              onChange={(v) => set({ items: v })}
              newItem={() => ({ index: "01", title: "", body: "" })}
              itemLabel="Principle"
              renderItem={(item, update) => (
                <>
                  <Field label="Index"><TextInput value={item.index} onChange={(v) => update({ index: v })} /></Field>
                  <Field label="Title"><TextInput value={item.title} onChange={(v) => update({ title: v })} /></Field>
                  <Field label="Body"><TextAreaInput value={item.body} onChange={(v) => update({ body: v })} /></Field>
                </>
              )}
            />
          </Field>
          <Field label="Closing line"><TextInput value={c.closingLine ?? ""} onChange={(v) => set({ closingLine: v })} /></Field>
        </>
      );

    case "cta":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Description"><TextAreaInput value={c.body ?? ""} onChange={(v) => set({ body: v })} /></Field>
          <CtaEditor label="Primary CTA (required)" value={c.primaryCta} onChange={(v: CtaValue | undefined) => set({ primaryCta: v ?? { label: "", href: "" } })} />
          <CtaEditor label="Secondary CTA" value={c.secondaryCta} onChange={(v: CtaValue | undefined) => set({ secondaryCta: v })} />
        </>
      );

    case "image":
      return (
        <>
          <MediaField value={c.media} onChange={(m) => set({ media: m })} />
          <Field label="Caption"><TextInput value={c.caption ?? ""} onChange={(v) => set({ caption: v })} /></Field>
        </>
      );

    case "image_text":
      return (
        <>
          <MediaField value={c.media} onChange={(m) => set({ media: m })} />
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Body"><TextAreaInput value={c.body ?? ""} onChange={(v) => set({ body: v })} /></Field>
          <Field label="Image position">
            <select className="admin-select" value={c.mediaPosition ?? "left"} onChange={(e) => set({ mediaPosition: e.target.value })}>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </Field>
        </>
      );

    case "faq":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Questions">
            <ArrayEditor<AnyContent>
              items={c.items ?? []}
              onChange={(v) => set({ items: v })}
              newItem={() => ({ question: "", answer: "" })}
              itemLabel="Question"
              renderItem={(item, update) => (
                <>
                  <Field label="Question"><TextInput value={item.question} onChange={(v) => update({ question: v })} /></Field>
                  <Field label="Answer"><TextAreaInput value={item.answer} onChange={(v) => update({ answer: v })} /></Field>
                </>
              )}
            />
          </Field>
        </>
      );

    default:
      return <p className="meta">Unknown section type: {type}</p>;
  }
}
