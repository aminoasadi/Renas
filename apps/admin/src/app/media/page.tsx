"use client";

import { useEffect, useRef, useState } from "react";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { api, ApiError } from "@/lib/api-client";
import type { MediaAsset } from "@/lib/types";

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [references, setReferences] = useState<string[] | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    setItems(await api<MediaAsset[]>(`/media${search ? `?search=${encodeURIComponent(search)}` : ""}`));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api("/media/upload", { method: "POST", body: formData, isFormData: true });
      await load();
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function selectAsset(asset: MediaAsset) {
    setSelected(asset);
    const { references } = await api<{ references: string[] }>(`/media/${asset.id}/references`);
    setReferences(references);
  }

  async function saveMetadata() {
    if (!selected) return;
    await api(`/media/${selected.id}`, { method: "PATCH", body: { alt: selected.alt, caption: selected.caption } });
    await load();
  }

  async function deleteAsset(force = false) {
    if (!selected) return;
    if (!force && !confirm("Delete this media asset?")) return;
    try {
      await api(`/media/${selected.id}${force ? "?force=true" : ""}`, { method: "DELETE" });
      setSelected(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        if (confirm(`${err.message}\n\nDelete anyway?`)) await deleteAsset(true);
      } else {
        alert("Failed to delete.");
      }
    }
  }

  return (
    <RequireAuth>
      <AdminShell>
        <div className="admin-page-header">
          <h1>Media</h1>
          <div>
            <button className="admin-btn admin-btn--primary" onClick={() => fileInput.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload"}
            </button>
            <input ref={fileInput} type="file" hidden accept="image/*,application/pdf" onChange={handleUpload} />
          </div>
        </div>

        <input className="admin-input" style={{ maxWidth: 260, marginBottom: 16 }} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 320px" : "1fr", gap: 24 }}>
          <div className="media-grid">
            {items.map((item) => (
              <div key={item.id} className={`media-tile${selected?.id === item.id ? " is-selected" : ""}`} onClick={() => selectAsset(item)}>
                {item.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.publicUrl} alt={item.alt ?? ""} />
                ) : (
                  <div style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream-2)" }}>PDF</div>
                )}
                <div className="media-tile__name">{item.originalFilename}</div>
              </div>
            ))}
            {items.length === 0 && <p className="meta">No media uploaded yet.</p>}
          </div>

          {selected && (
            <aside className="admin-card" style={{ position: "sticky", top: 16, height: "fit-content" }}>
              {selected.mimeType.startsWith("image/") && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.publicUrl} alt="" style={{ width: "100%", borderRadius: 4, marginBottom: 12 }} />
              )}
              <p className="meta">{selected.originalFilename}</p>
              <p className="meta">{(selected.size / 1024).toFixed(0)} KB{selected.width ? ` · ${selected.width}×${selected.height}` : ""}</p>

              <div className="admin-field">
                <label className="admin-label">Alt text</label>
                <input className="admin-input" value={selected.alt ?? ""} onChange={(e) => setSelected({ ...selected, alt: e.target.value })} />
              </div>
              <div className="admin-field">
                <label className="admin-label">Caption</label>
                <input className="admin-input" value={selected.caption ?? ""} onChange={(e) => setSelected({ ...selected, caption: e.target.value })} />
              </div>
              <button className="admin-btn admin-btn--sm" style={{ marginBottom: 8 }} onClick={saveMetadata}>Save</button>
              <button
                className="admin-btn admin-btn--sm"
                style={{ marginBottom: 8, marginLeft: 8 }}
                onClick={() => navigator.clipboard.writeText(selected.publicUrl)}
              >
                Copy URL
              </button>

              {references && references.length > 0 && (
                <p className="admin-hint" style={{ color: "#b5443a" }}>Referenced by: {references.join(", ")}</p>
              )}

              <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => deleteAsset(false)}>
                Delete
              </button>
            </aside>
          )}
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
