"use client";

import { useState } from "react";
import { Field, TextInput, TextAreaInput, MediaField, CtaEditor, ArrayEditor, type CtaValue } from "./shared";
import { TipTapEditor } from "@/components/TipTapEditor";

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

function stringListEditor(
  label: string,
  hint: string,
  items: string[],
  onChange: (items: string[]) => void,
  multiline = false,
) {
  const Input = multiline ? TextAreaInput : TextInput;
  return (
    <Field label={label} hint={hint}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <Input
              value={item}
              onChange={(v: string) => {
                const next = items.slice();
                next[i] = v;
                onChange(next);
              }}
            />
          </div>
          <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="admin-btn admin-btn--sm" onClick={() => onChange([...items, ""])}>
        + Add
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
        <Field label="Content" hint="Sanitized before rendering — only a safe tag allowlist is preserved.">
          <TipTapEditor format="html" content={c.html ?? ""} onChange={(html) => set({ html })} />
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

    case "supply_equation":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Terms" hint="At least 2. Mark the last one 'Result' to render it as the equation's outcome.">
            <ArrayEditor<AnyContent>
              items={c.terms ?? []}
              onChange={(v) => set({ terms: v })}
              newItem={() => ({ term: "", label: "", copy: "", isResult: false })}
              itemLabel="Term"
              renderItem={(item, update) => (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-5)" }}>
                    <Field label="Term key"><TextInput value={item.term} onChange={(v) => update({ term: v })} /></Field>
                    <Field label="Label"><TextInput value={item.label} onChange={(v) => update({ label: v })} /></Field>
                  </div>
                  <Field label="Copy (shown on hover)"><TextAreaInput value={item.copy} onChange={(v) => update({ copy: v })} /></Field>
                  <label className="admin-checkbox-row">
                    <input type="checkbox" checked={Boolean(item.isResult)} onChange={(e) => update({ isResult: e.target.checked })} />
                    This is the result term (e.g. &quot;Delivery&quot;)
                  </label>
                </>
              )}
            />
          </Field>
          <Field label="Foot note"><TextInput value={c.footNote ?? ""} onChange={(v) => set({ footNote: v })} /></Field>
        </>
      );

    case "heavy_vehicle_focus":
      return (
        <>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Subheadline"><TextInput value={c.subheadline ?? ""} onChange={(v) => set({ subheadline: v })} /></Field>
          <Field label="Body"><TextAreaInput value={c.body ?? ""} onChange={(v) => set({ body: v })} /></Field>
          <MediaField value={c.media} onChange={(m) => set({ media: m })} />
          <Field label="Overlay labels (comma-separated)">
            <TextInput value={(c.overlayLabels ?? []).join(", ")} onChange={(v) => set({ overlayLabels: v.split(",").map((s: string) => s.trim()).filter(Boolean) })} />
          </Field>
          <CtaEditor label="CTA" value={c.cta} onChange={(v: CtaValue | undefined) => set({ cta: v })} />
        </>
      );

    case "requirement_composer":
      return (
        <>
          <p className="meta" style={{ marginBottom: "var(--sp-4)" }}>
            Only the surrounding copy is editable here — the multi-step form itself (fields, validation, submission) is fixed to the RFQ schema and isn&apos;t content-driven.
          </p>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Body"><TextAreaInput value={c.body ?? ""} onChange={(v) => set({ body: v })} /></Field>
        </>
      );

    case "page_masthead":
      return (
        <>
          <Field label="Variant" hint="Changes layout only — content fields stay the same.">
            <select className="admin-select" value={c.variant ?? "stacked"} onChange={(e) => set({ variant: e.target.value })}>
              <option value="stacked">Stacked</option>
              <option value="split">Split (headline/CTA left, standfirst right)</option>
              <option value="indexed">Indexed (standfirst + numbered summary side by side)</option>
            </select>
          </Field>
          <Field label="Kicker"><TextInput value={c.kicker ?? ""} onChange={(v) => set({ kicker: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Standfirst" hint="The page's opening paragraph — this carries the weight a hero image would on the homepage.">
            <TextAreaInput value={c.standfirst ?? ""} onChange={(v) => set({ standfirst: v })} rows={4} />
          </Field>
          <Field label="Intro (optional second paragraph)"><TextAreaInput value={c.intro ?? ""} onChange={(v) => set({ intro: v })} /></Field>
          {stringListEditor("Summary points (up to 6)", "Scannable \"what this page covers\" bullets.", c.summaryPoints ?? [], (v) => set({ summaryPoints: v }))}
          <Field label="Meta (up to 6 label/value pairs)">
            <ArrayEditor<AnyContent>
              items={c.meta ?? []}
              onChange={(v) => set({ meta: v })}
              newItem={() => ({ label: "", value: "" })}
              itemLabel="Meta"
              renderItem={(item, update) => (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Field label="Label"><TextInput value={item.label} onChange={(v) => update({ label: v })} /></Field>
                  <Field label="Value"><TextInput value={item.value} onChange={(v) => update({ value: v })} /></Field>
                </div>
              )}
            />
          </Field>
          <CtaEditor label="Primary CTA" value={c.primaryCta} onChange={(v: CtaValue | undefined) => set({ primaryCta: v })} />
          <CtaEditor label="Secondary CTA" value={c.secondaryCta} onChange={(v: CtaValue | undefined) => set({ secondaryCta: v })} />
        </>
      );

    case "editorial_dossier":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Intro"><TextAreaInput value={c.intro ?? ""} onChange={(v) => set({ intro: v })} /></Field>
          <Field label="Contents label"><TextInput value={c.contentsLabel ?? ""} onChange={(v) => set({ contentsLabel: v })} placeholder="CONTENTS" /></Field>
          <Field label="Chapters">
            <ArrayEditor<AnyContent>
              items={c.chapters ?? []}
              onChange={(v) => set({ chapters: v })}
              newItem={() => ({ id: "", number: "01", title: "", body: [""], keyPointsTitle: "", keyPoints: [] })}
              itemLabel="Chapter"
              renderItem={(item, update) => (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <Field label="Anchor id" hint="lowercase-with-hyphens, used as #anchor"><TextInput value={item.id} onChange={(v) => update({ id: v })} /></Field>
                    <Field label="Number"><TextInput value={item.number} onChange={(v) => update({ number: v })} /></Field>
                  </div>
                  <Field label="Title"><TextInput value={item.title} onChange={(v) => update({ title: v })} /></Field>
                  {stringListEditor("Body paragraphs", "One paragraph per row.", item.body ?? [], (v) => update({ body: v }), true)}
                  <Field label="Key points title"><TextInput value={item.keyPointsTitle ?? ""} onChange={(v) => update({ keyPointsTitle: v })} /></Field>
                  {stringListEditor("Key points", "Rendered as a bullet list under the title above.", item.keyPoints ?? [], (v) => update({ keyPoints: v }))}
                </>
              )}
            />
          </Field>
        </>
      );

    case "spec_table":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Intro"><TextAreaInput value={c.intro ?? ""} onChange={(v) => set({ intro: v })} /></Field>
          <Field label="Groups">
            <ArrayEditor<AnyContent>
              items={c.groups ?? []}
              onChange={(v) => set({ groups: v })}
              newItem={() => ({ id: "", number: "", title: "", description: "", rows: [{ term: "", detail: "" }] })}
              itemLabel="Group"
              renderItem={(item, update) => (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                    <Field label="Anchor id"><TextInput value={item.id} onChange={(v) => update({ id: v })} /></Field>
                    <Field label="Number"><TextInput value={item.number ?? ""} onChange={(v) => update({ number: v })} /></Field>
                  </div>
                  <Field label="Title"><TextInput value={item.title} onChange={(v) => update({ title: v })} /></Field>
                  <Field label="Description"><TextAreaInput value={item.description ?? ""} onChange={(v) => update({ description: v })} /></Field>
                  <Field label="Rows">
                    <ArrayEditor<AnyContent>
                      items={item.rows ?? []}
                      onChange={(v) => update({ rows: v })}
                      newItem={() => ({ term: "", detail: "", note: "" })}
                      itemLabel="Row"
                      renderItem={(row, updateRow) => (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 8 }}>
                          <Field label="Term"><TextInput value={row.term} onChange={(v) => updateRow({ term: v })} /></Field>
                          <Field label="Detail"><TextInput value={row.detail} onChange={(v) => updateRow({ detail: v })} /></Field>
                          <Field label="Note (optional)"><TextInput value={row.note ?? ""} onChange={(v) => updateRow({ note: v })} /></Field>
                        </div>
                      )}
                    />
                  </Field>
                </>
              )}
            />
          </Field>
          <Field label="Foot note"><TextInput value={c.footNote ?? ""} onChange={(v) => set({ footNote: v })} /></Field>
        </>
      );

    case "stage_dossier":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Intro"><TextAreaInput value={c.intro ?? ""} onChange={(v) => set({ intro: v })} /></Field>
          <Field label="Stages">
            <ArrayEditor<AnyContent>
              items={c.stages ?? []}
              onChange={(v) => set({ stages: v })}
              newItem={() => ({ number: "01", title: "", duration: "", body: "", inputsTitle: "", inputs: [], outputsTitle: "", outputs: [] })}
              itemLabel="Stage"
              renderItem={(item, update) => (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 8 }}>
                    <Field label="Number"><TextInput value={item.number} onChange={(v) => update({ number: v })} /></Field>
                    <Field label="Title"><TextInput value={item.title} onChange={(v) => update({ title: v })} /></Field>
                    <Field label="Duration"><TextInput value={item.duration ?? ""} onChange={(v) => update({ duration: v })} /></Field>
                  </div>
                  <Field label="Body"><TextAreaInput value={item.body} onChange={(v) => update({ body: v })} /></Field>
                  <Field label="Inputs title"><TextInput value={item.inputsTitle ?? ""} onChange={(v) => update({ inputsTitle: v })} placeholder="WHAT WE NEED" /></Field>
                  {stringListEditor("Inputs", "", item.inputs ?? [], (v) => update({ inputs: v }))}
                  <Field label="Outputs title"><TextInput value={item.outputsTitle ?? ""} onChange={(v) => update({ outputsTitle: v })} placeholder="WHAT YOU GET" /></Field>
                  {stringListEditor("Outputs", "", item.outputs ?? [], (v) => update({ outputs: v }))}
                </>
              )}
            />
          </Field>
          <Field label="Closing note"><TextAreaInput value={c.closingNote ?? ""} onChange={(v) => set({ closingNote: v })} /></Field>
        </>
      );

    case "narrative_feature":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Standfirst"><TextAreaInput value={c.standfirst ?? ""} onChange={(v) => set({ standfirst: v })} /></Field>
          <Field label="Blocks" hint="Paragraph, subheading, or pull quote — in reading order.">
            <ArrayEditor<AnyContent>
              items={c.blocks ?? []}
              onChange={(v) => set({ blocks: v })}
              newItem={() => ({ kind: "paragraph", text: "" })}
              itemLabel="Block"
              renderItem={(item, update) => (
                <>
                  <Field label="Kind">
                    <select className="admin-select" value={item.kind ?? "paragraph"} onChange={(e) => update({ kind: e.target.value })}>
                      <option value="paragraph">Paragraph</option>
                      <option value="subheading">Subheading</option>
                      <option value="pullquote">Pull quote</option>
                    </select>
                  </Field>
                  <Field label="Text"><TextAreaInput value={item.text ?? ""} onChange={(v) => update({ text: v })} /></Field>
                  {item.kind === "pullquote" && (
                    <Field label="Attribution (optional)"><TextInput value={item.attribution ?? ""} onChange={(v) => update({ attribution: v })} /></Field>
                  )}
                </>
              )}
            />
          </Field>
        </>
      );

    case "glossary":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={c.eyebrow ?? ""} onChange={(v) => set({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={c.headline ?? ""} onChange={(v) => set({ headline: v })} /></Field>
          <Field label="Intro"><TextAreaInput value={c.intro ?? ""} onChange={(v) => set({ intro: v })} /></Field>
          <Field label="Entries">
            <ArrayEditor<AnyContent>
              items={c.entries ?? []}
              onChange={(v) => set({ entries: v })}
              newItem={() => ({ term: "", definition: "", aka: [] })}
              itemLabel="Entry"
              renderItem={(item, update) => (
                <>
                  <Field label="Term"><TextInput value={item.term} onChange={(v) => update({ term: v })} /></Field>
                  <Field label="Definition"><TextAreaInput value={item.definition} onChange={(v) => update({ definition: v })} /></Field>
                  <Field label="Also known as (comma-separated)">
                    <TextInput value={(item.aka ?? []).join(", ")} onChange={(v) => update({ aka: v.split(",").map((s: string) => s.trim()).filter(Boolean) })} />
                  </Field>
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
