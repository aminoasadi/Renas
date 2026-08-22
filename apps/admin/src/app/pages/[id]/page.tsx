"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RequireAuth, useAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { SortableSectionList } from "@/components/SortableSectionList";
import { api, ApiError } from "@/lib/api-client";
import { hasUnpublishedChanges } from "@/lib/content-state";
import { PAGE_SECTION_TYPES } from "@renas/shared";
import type { AdminPage, Revision } from "@/lib/types";

const SECTION_DEFAULTS: Record<string, unknown> = {
  hero: { eyebrow: "", headlineLines: ["NEW", "HEADLINE"], images: [] },
  rich_text: { html: "<p>New content.</p>" },
  process: { headline: "Process headline", steps: [] },
  supply_categories: { headline: "Categories headline", items: [] },
  supply_system: { headline: "System headline", centerLabel: "RENAS", nodes: [] },
  component_index: { headline: "Index headline", items: [] },
  decision_layer: { headline: "Decision headline", factors: [] },
  route_stories: { headline: "Routes headline", stories: [] },
  operational_signals: { headline: "Signals headline", signals: [] },
  capability: { headline: "Capability headline", media: null },
  principles: { headline: "Principles headline", items: [] },
  cta: { headline: "Call to action", primaryCta: { label: "Learn more", href: "/" } },
  image: { media: null },
  image_text: { headline: "Headline", body: "Body copy.", media: null, mediaPosition: "left" },
  faq: { headline: "FAQ", items: [] },
};

export default function PageEditorPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [page, setPage] = useState<AdminPage | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [publishModal, setPublishModal] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [revisions, setRevisions] = useState<Revision[] | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const p = await api<AdminPage>(`/pages/${params.id}`);
    setPage(p);
    setTitle(p.title);
    setSlug(p.slug);
    setDirty(false);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  if (!page) {
    return (
      <RequireAuth>
        <AdminShell>
          <p className="meta">Loading…</p>
        </AdminShell>
      </RequireAuth>
    );
  }

  async function updateSectionContent(sectionId: string, content: unknown) {
    setPage((prev) =>
      prev ? { ...prev, sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, content } : s)) } : prev,
    );
    setDirty(true);
    try {
      await api(`/pages/${page!.id}/sections/${sectionId}`, { method: "PATCH", body: { content } });
    } catch {
      setToast("Failed to save section — try again.");
    }
  }

  async function toggleVisible(sectionId: string, isVisible: boolean) {
    setPage((prev) =>
      prev ? { ...prev, sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, isVisible } : s)) } : prev,
    );
    await api(`/pages/${page!.id}/sections/${sectionId}`, { method: "PATCH", body: { isVisible } });
    setDirty(true);
  }

  async function duplicateSection(sectionId: string) {
    await api(`/pages/${page!.id}/sections/${sectionId}/duplicate`, { method: "POST" });
    await load();
    setDirty(true);
  }

  async function removeSection(sectionId: string) {
    if (!confirm("Delete this section? This cannot be undone (until you restore an earlier revision).")) return;
    await api(`/pages/${page!.id}/sections/${sectionId}`, { method: "DELETE" });
    await load();
    setDirty(true);
  }

  async function reorderSections(orderedIds: string[]) {
    setPage((prev) =>
      prev ? { ...prev, sections: orderedIds.map((id) => prev.sections.find((s) => s.id === id)!) } : prev,
    );
    await api(`/pages/${page!.id}/sections/reorder`, { method: "POST", body: { orderedIds } });
    setDirty(true);
  }

  async function addSection(type: string) {
    await api(`/pages/${page!.id}/sections`, { method: "POST", body: { type, content: SECTION_DEFAULTS[type] ?? {} } });
    setAddingSection(false);
    await load();
    setDirty(true);
  }

  async function saveMeta() {
    setSaving(true);
    try {
      await api(`/pages/${page!.id}`, { method: "PATCH", body: { title, slug } });
      await load();
      setToast("Draft saved.");
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    const { url } = await api<{ url: string }>(`/pages/${page!.id}/preview-url`);
    window.open(url, "_blank");
  }

  async function handlePublish() {
    await api(`/pages/${page!.id}/publish`, { method: "POST" });
    setPublishModal(false);
    await load();
    setToast("Published. The live site now reflects this content.");
  }

  async function handleUnpublish() {
    if (!confirm("Unpublish this page? It will stop being publicly visible until republished.")) return;
    await api(`/pages/${page!.id}/unpublish`, { method: "POST" });
    await load();
  }

  async function openRevisions() {
    setRevisionsOpen(true);
    const revs = await api<Revision[]>(`/pages/${page!.id}/revisions`);
    setRevisions(revs);
  }

  async function restoreRevision(version: number) {
    if (!confirm(`Restore version ${version} as the current draft? You'll still need to Publish to make it live.`)) return;
    await api(`/pages/${page!.id}/revisions/${version}/restore`, { method: "POST" });
    setRevisionsOpen(false);
    await load();
    setToast(`Restored version ${version} as draft.`);
  }

  const publishedTitle = (page.publishedSnapshot as { title?: string } | null)?.title;
  const currentSection = null; // reserved for future "currently focused section" breadcrumb state

  return (
    <RequireAuth>
      <AdminShell>
        <div className="admin-breadcrumb" style={{ marginBottom: 8 }}>
          <a href="/pages">Pages</a> / {page.title} {currentSection}
        </div>

        {dirty && <div className="unsaved-banner">You have unsaved changes. Save Draft before leaving this page.</div>}
        {toast && (
          <div className="admin-card" style={{ marginBottom: 16, background: "var(--cream-2)" }}>
            {toast}{" "}
            <button className="admin-btn admin-btn--sm admin-btn--ghost" onClick={() => setToast("")}>
              Dismiss
            </button>
          </div>
        )}

        <div className="admin-page-header">
          <div>
            <h1>{page.title}</h1>
            <StatusBadge status={page.status} hasUnpublishedChanges={hasUnpublishedChanges(page)} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="admin-btn" onClick={openRevisions}>
              Revisions
            </button>
            {page.status === "PUBLISHED" && (
              <a className="admin-btn" href={`${process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"}/${page.slug === "home" ? "" : page.slug}`} target="_blank" rel="noreferrer">
                View Live
              </a>
            )}
            <button className="admin-btn" onClick={handlePreview}>
              Preview Draft
            </button>
            {page.status === "PUBLISHED" && (
              <button className="admin-btn admin-btn--danger" onClick={handleUnpublish}>
                Unpublish
              </button>
            )}
            <button className="admin-btn admin-btn--primary" onClick={saveMeta} disabled={saving}>
              {saving ? "Saving…" : "Save Draft"}
            </button>
            <button className="admin-btn admin-btn--gold" onClick={() => setPublishModal(true)}>
              Publish Changes
            </button>
          </div>
        </div>

        <div className="editor-shell">
          <div>
            <SortableSectionList
              sections={page.sections}
              onReorder={reorderSections}
              onUpdateContent={updateSectionContent}
              onToggleVisible={toggleVisible}
              onDuplicate={duplicateSection}
              onRemove={removeSection}
            />
            <button className="admin-btn" style={{ marginTop: 16 }} onClick={() => setAddingSection(true)}>
              + Add Section
            </button>
          </div>

          <aside className="editor-sidebar">
            <div className="admin-card">
              <p className="admin-label">Page settings</p>
              <div className="admin-field">
                <label className="admin-label">Title</label>
                <input className="admin-input" value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} />
              </div>
              <div className="admin-field">
                <label className="admin-label">Slug</label>
                <input className="admin-input" value={slug} onChange={(e) => { setSlug(e.target.value); setDirty(true); }} />
                <p className="admin-hint">A redirect from the old slug is created automatically if this page is published.</p>
              </div>
            </div>

            <div className="admin-card meta">
              <p><strong>Editor:</strong> {user?.name}</p>
              <p><strong>Draft updated:</strong> {new Date(page.updatedAt).toLocaleString()}</p>
              {page.publishedAt && <p><strong>Last published:</strong> {new Date(page.publishedAt).toLocaleString()}</p>}
            </div>
          </aside>
        </div>

        {addingSection && (
          <div className="modal-overlay" onClick={() => setAddingSection(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>Add Section</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {PAGE_SECTION_TYPES.map((type) => (
                  <button key={type} className="admin-btn" style={{ justifyContent: "flex-start" }} onClick={() => addSection(type)}>
                    {type.replace(/_/g, " ").toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {publishModal && (
          <div className="modal-overlay" onClick={() => setPublishModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>Publish Changes</h3>
              <p><strong>Page:</strong> {page.title}</p>
              <p><strong>Current status:</strong> {page.status}</p>
              <p><strong>Last live publication:</strong> {page.publishedAt ? new Date(page.publishedAt).toLocaleString() : "Never published"}</p>
              {publishedTitle && publishedTitle !== title && (
                <p className="admin-hint">Live title will change from &quot;{publishedTitle}&quot; to &quot;{title}&quot;.</p>
              )}
              <p><strong>Draft last modified:</strong> {new Date(page.updatedAt).toLocaleString()}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="admin-btn admin-btn--gold" onClick={handlePublish}>
                  Publish Changes
                </button>
                <button className="admin-btn admin-btn--ghost" onClick={() => setPublishModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {revisionsOpen && (
          <div className="modal-overlay" onClick={() => setRevisionsOpen(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>Revisions</h3>
              {!revisions ? (
                <p className="meta">Loading…</p>
              ) : revisions.length === 0 ? (
                <p className="meta">No revisions yet — publish once to create the first one.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Editor</th>
                      <th>Timestamp</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {revisions.map((rev) => (
                      <tr key={rev.id}>
                        <td>v{rev.version}</td>
                        <td>{rev.editor?.name ?? "—"}</td>
                        <td className="meta">{new Date(rev.createdAt).toLocaleString()}</td>
                        <td>
                          <button className="admin-btn admin-btn--sm" onClick={() => restoreRevision(rev.version)}>
                            Restore as Draft
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </AdminShell>
    </RequireAuth>
  );
}
