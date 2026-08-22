"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api-client";
import type { NavigationItem } from "@/lib/types";

function NavEditor({ navKey, title }: { navKey: "HEADER" | "FOOTER"; title: string }) {
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<{ items: NavigationItem[] }>(`/navigation/${navKey}`).then((nav) => setItems(nav.items));
  }, [navKey]);

  function update(index: number, patch: Partial<NavigationItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    setSaved(false);
  }
  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }
  function add() {
    setItems((prev) => [...prev, { id: `new-${Date.now()}`, label: "", url: "/", isExternal: false, target: "_self", position: prev.length, isVisible: true }]);
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
      await api(`/navigation/${navKey}`, { method: "PUT", body: { items: items.map((i) => ({ label: i.label, url: i.url, isExternal: i.isExternal, target: i.target, isVisible: i.isVisible })) } });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-card" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>{title}</h2>
        <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={save} disabled={saving}>
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      {items.map((item, i) => (
        <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto auto auto auto", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <input className="admin-input" placeholder="Label" value={item.label} onChange={(e) => update(i, { label: e.target.value })} />
          <input className="admin-input" placeholder="/path or https://…" value={item.url} onChange={(e) => update(i, { url: e.target.value })} />
          <label className="admin-checkbox-row">
            <input type="checkbox" checked={item.isExternal} onChange={(e) => update(i, { isExternal: e.target.checked, target: e.target.checked ? "_blank" : "_self" })} />
            External
          </label>
          <label className="admin-checkbox-row">
            <input type="checkbox" checked={item.isVisible} onChange={(e) => update(i, { isVisible: e.target.checked })} />
            Visible
          </label>
          <button className="admin-btn admin-btn--sm admin-btn--ghost" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
          <button className="admin-btn admin-btn--sm admin-btn--ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</button>
          <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <button className="admin-btn admin-btn--sm" onClick={add}>+ Add link</button>
    </div>
  );
}

export default function NavigationPage() {
  return (
    <RequireAuth>
      <AdminShell>
        <h1 style={{ marginBottom: 24 }}>Navigation</h1>
        <NavEditor navKey="HEADER" title="Header Navigation" />
        <NavEditor navKey="FOOTER" title="Footer Navigation" />
      </AdminShell>
    </RequireAuth>
  );
}
