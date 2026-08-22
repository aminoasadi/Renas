"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import type { MediaAsset } from "@/lib/types";

interface MediaRefValue {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export function MediaPicker({ value, onChange }: { value: MediaRefValue | null; onChange: (media: MediaRefValue | null) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {value ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.url} alt={value.alt ?? ""} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 4 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button type="button" className="admin-btn admin-btn--sm" onClick={() => setOpen(true)}>
              Change
            </button>
            <button type="button" className="admin-btn admin-btn--sm admin-btn--ghost" onClick={() => onChange(null)}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="admin-btn admin-btn--sm" onClick={() => setOpen(true)}>
          Select image
        </button>
      )}

      {open && (
        <MediaPickerModal
          onSelect={(asset) => {
            onChange({ id: asset.id, url: asset.publicUrl, alt: asset.alt ?? "", width: asset.width ?? undefined, height: asset.height ?? undefined });
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export function MediaPickerModal({ onSelect, onClose }: { onSelect: (asset: MediaAsset) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<MediaAsset[]>("/media").then(setItems);
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const asset = await api<MediaAsset>("/media/upload", { method: "POST", body: formData, isFormData: true });
      setItems((prev) => [asset, ...prev]);
      onSelect(asset);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Select Media</h3>
          <button type="button" className="admin-btn admin-btn--sm" onClick={onClose}>
            Close
          </button>
        </div>

        <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" style={{ marginBottom: 16 }} onClick={() => fileInput.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload New"}
        </button>
        <input ref={fileInput} type="file" hidden accept="image/*" onChange={handleUpload} />

        <div className="media-grid">
          {items.map((item) => (
            <div key={item.id} className="media-tile" onClick={() => onSelect(item)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.publicUrl} alt={item.alt ?? ""} />
              <div className="media-tile__name">{item.originalFilename}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
