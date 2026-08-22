"use client";

import { MediaPicker } from "../MediaPicker";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="admin-field">
      <label className="admin-label">{label}</label>
      {children}
      {hint && <p className="admin-hint">{hint}</p>}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input className="admin-input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function TextAreaInput({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return <textarea className="admin-textarea" style={{ resize: "vertical" }} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />;
}

export function MediaField({ value, onChange, label }: { value: unknown; onChange: (v: unknown) => void; label?: string }) {
  return (
    <Field label={label ?? "Image"}>
      <MediaPicker value={(value as never) ?? null} onChange={(m) => onChange(m)} />
    </Field>
  );
}

export interface CtaValue {
  label: string;
  href: string;
}
export function CtaEditor({ value, onChange, label }: { value: CtaValue | undefined; onChange: (v: CtaValue | undefined) => void; label: string }) {
  return (
    <div className="admin-card" style={{ background: "var(--cream-2)", marginBottom: 12 }}>
      <p className="admin-label">{label}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <TextInput value={value?.label ?? ""} placeholder="Button label" onChange={(v) => onChange({ label: v, href: value?.href ?? "" })} />
        <TextInput value={value?.href ?? ""} placeholder="/link-or-url" onChange={(v) => onChange({ label: value?.label ?? "", href: v })} />
      </div>
      {value && (
        <button type="button" className="admin-btn admin-btn--sm admin-btn--ghost" onClick={() => onChange(undefined)}>
          Remove CTA
        </button>
      )}
    </div>
  );
}

/** Generic add/remove/edit list for array-shaped section content (steps, items, factors, etc.). */
export function ArrayEditor<T>({
  items,
  onChange,
  newItem,
  renderItem,
  itemLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
  itemLabel: string;
}) {
  function update(index: number, patch: Partial<T>) {
    const next = items.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }
  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} className="admin-card" style={{ marginBottom: 10, background: "var(--cream-2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span className="meta">
              {itemLabel} {i + 1}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button type="button" className="admin-btn admin-btn--sm admin-btn--ghost" onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </button>
              <button type="button" className="admin-btn admin-btn--sm admin-btn--ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                ↓
              </button>
              <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => remove(i)}>
                Remove
              </button>
            </div>
          </div>
          {renderItem(item, (patch) => update(i, patch), i)}
        </div>
      ))}
      <button type="button" className="admin-btn admin-btn--sm" onClick={() => onChange([...items, newItem()])}>
        + Add {itemLabel}
      </button>
    </div>
  );
}
