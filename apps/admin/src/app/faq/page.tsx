"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api-client";
import type { FaqItem } from "@/lib/types";

const LOCALES = [
  { code: "en", label: "English" },
  { code: "fa", label: "فارسی" },
] as const;

export default function FaqPage() {
  const [locale, setLocale] = useState<"en" | "fa">("en");
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSaved(false);
    api<FaqItem[]>(`/faq?locale=${locale}`)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [locale]);

  function update(index: number, patch: Partial<FaqItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    setSaved(false);
  }
  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }
  function add() {
    setItems((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, question: "", answer: "", position: prev.length, isVisible: true },
    ]);
    setSaved(false);
  }
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    setItems((prev) => {
      const next = prev.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await api<FaqItem[]>(`/faq?locale=${locale}`, {
        method: "PUT",
        body: { items: items.map((i) => ({ question: i.question, answer: i.answer, isVisible: i.isVisible })) },
      });
      setItems(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAuth>
      <AdminShell>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>FAQ</h1>
            <p className="meta">Shown on the public site&rsquo;s FAQ page, in this order. Hidden items stay saved but won&rsquo;t appear publicly.</p>
          </div>
          <button className="admin-btn admin-btn--primary" onClick={save} disabled={saving || loading}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {LOCALES.map((l) => (
            <button
              key={l.code}
              className={`admin-btn admin-btn--sm ${locale === l.code ? "admin-btn--primary" : "admin-btn--ghost"}`}
              onClick={() => setLocale(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="meta">Loading…</p>
        ) : (
          <div className="admin-card">
            {items.length === 0 && <p className="meta" style={{ marginBottom: 16 }}>No questions yet.</p>}

            {items.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 12,
                  alignItems: "start",
                  paddingBlock: 16,
                  borderTop: i > 0 ? "1px solid var(--rule-on-cream, #e5e2da)" : undefined,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 4 }}>
                  <button className="admin-btn admin-btn--sm admin-btn--ghost" onClick={() => move(i, -1)} disabled={i === 0}>
                    ↑
                  </button>
                  <button className="admin-btn admin-btn--sm admin-btn--ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                    ↓
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    className="admin-input"
                    placeholder="Question"
                    value={item.question}
                    onChange={(e) => update(i, { question: e.target.value })}
                  />
                  <textarea
                    className="admin-textarea"
                    style={{ resize: "vertical" }}
                    rows={3}
                    placeholder="Answer"
                    value={item.answer}
                    onChange={(e) => update(i, { answer: e.target.value })}
                  />
                  <label className="admin-checkbox-row">
                    <input type="checkbox" checked={item.isVisible} onChange={(e) => update(i, { isVisible: e.target.checked })} />
                    Visible on the public FAQ page
                  </label>
                </div>

                <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => remove(i)}>
                  ✕
                </button>
              </div>
            ))}

            <button className="admin-btn admin-btn--sm" style={{ marginTop: 16 }} onClick={add}>
              + Add question
            </button>
          </div>
        )}
      </AdminShell>
    </RequireAuth>
  );
}
