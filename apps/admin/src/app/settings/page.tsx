"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { MediaField } from "@/components/section-editors/shared";
import { api } from "@/lib/api-client";
import type { SiteSettings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [logo, setLogo] = useState<unknown>(null);
  const [favicon, setFavicon] = useState<unknown>(null);
  const [ogImage, setOgImage] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<SiteSettings>("/settings").then(setSettings);
  }, []);

  if (!settings) {
    return (
      <RequireAuth role="SUPER_ADMIN">
        <AdminShell>
          <p className="meta">Loading…</p>
        </AdminShell>
      </RequireAuth>
    );
  }

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      await api("/settings", {
        method: "PUT",
        body: {
          companyName: settings!.companyName,
          defaultSeoTitle: settings!.defaultSeoTitle,
          defaultSeoDescription: settings!.defaultSeoDescription,
          contactEmail: settings!.contactEmail,
          phone: settings!.phone,
          whatsapp: settings!.whatsapp,
          linkedin: settings!.linkedin,
          officeAddress: settings!.officeAddress,
          footerText: settings!.footerText,
          logoMediaId: (logo as { id: string } | null)?.id ?? settings!.logoMediaId,
          faviconMediaId: (favicon as { id: string } | null)?.id ?? settings!.faviconMediaId,
          defaultOgImageId: (ogImage as { id: string } | null)?.id ?? settings!.defaultOgImageId,
        },
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAuth role="SUPER_ADMIN">
      <AdminShell>
        <div className="admin-page-header">
          <h1>Settings</h1>
          <button className="admin-btn admin-btn--primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 900 }}>
          <div className="admin-card">
            <h2 style={{ fontSize: 16, marginTop: 0 }}>Company</h2>
            <div className="admin-field">
              <label className="admin-label">Company Name</label>
              <input className="admin-input" value={settings.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </div>
            <div className="admin-field">
              <label className="admin-label">Contact Email</label>
              <input className="admin-input" value={settings.contactEmail ?? ""} onChange={(e) => set("contactEmail", e.target.value)} />
            </div>
            <div className="admin-field">
              <label className="admin-label">Phone</label>
              <input className="admin-input" value={settings.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="admin-field">
              <label className="admin-label">WhatsApp</label>
              <input className="admin-input" value={settings.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} />
            </div>
            <div className="admin-field">
              <label className="admin-label">LinkedIn</label>
              <input className="admin-input" value={settings.linkedin ?? ""} onChange={(e) => set("linkedin", e.target.value)} />
            </div>
            <div className="admin-field">
              <label className="admin-label">Office Address</label>
              <input className="admin-input" value={settings.officeAddress ?? ""} onChange={(e) => set("officeAddress", e.target.value)} />
            </div>
            <div className="admin-field">
              <label className="admin-label">Footer Text</label>
              <textarea className="admin-textarea" rows={2} value={settings.footerText ?? ""} onChange={(e) => set("footerText", e.target.value)} />
            </div>
          </div>

          <div>
            <div className="admin-card" style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, marginTop: 0 }}>Default SEO</h2>
              <div className="admin-field">
                <label className="admin-label">Default SEO Title</label>
                <input className="admin-input" value={settings.defaultSeoTitle ?? ""} onChange={(e) => set("defaultSeoTitle", e.target.value)} />
              </div>
              <div className="admin-field">
                <label className="admin-label">Default SEO Description</label>
                <textarea className="admin-textarea" rows={2} value={settings.defaultSeoDescription ?? ""} onChange={(e) => set("defaultSeoDescription", e.target.value)} />
              </div>
            </div>

            <div className="admin-card">
              <h2 style={{ fontSize: 16, marginTop: 0 }}>Brand Assets</h2>
              <p className="admin-label">Logo</p>
              <MediaField value={logo} onChange={setLogo} label="" />
              <p className="admin-label" style={{ marginTop: 16 }}>Favicon</p>
              <MediaField value={favicon} onChange={setFavicon} label="" />
              <p className="admin-label" style={{ marginTop: 16 }}>Default OG Image</p>
              <MediaField value={ogImage} onChange={setOgImage} label="" />
            </div>
          </div>
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
