"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { TipTapEditor } from "@/components/TipTapEditor";
import { MediaField } from "@/components/section-editors/shared";
import { api } from "@/lib/api-client";
import { hasUnpublishedChanges } from "@/lib/content-state";
import type { AdminBlogPost, Revision } from "@/lib/types";

interface Taxonomy {
  id: string;
  name: string;
  slug: string;
}

export default function BlogEditorPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<AdminBlogPost | null>(null);
  const [categories, setCategories] = useState<Taxonomy[]>([]);
  const [tags, setTags] = useState<Taxonomy[]>([]);
  const [authors, setAuthors] = useState<Array<{ id: string; name: string }>>([]);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState<unknown>(null);
  const [coverImage, setCoverImage] = useState<unknown>(null);
  const [authorId, setAuthorId] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [publishModal, setPublishModal] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [revisions, setRevisions] = useState<Revision[] | null>(null);

  const load = useCallback(async () => {
    const [p, cats, tgs, auths] = await Promise.all([
      api<AdminBlogPost>(`/blog/${params.id}`),
      api<Taxonomy[]>("/categories"),
      api<Taxonomy[]>("/tags"),
      api<Array<{ id: string; name: string }>>("/authors"),
    ]);
    setPost(p);
    setCategories(cats);
    setTags(tgs);
    setAuthors(auths);
    setTitle(p.title);
    setSlug(p.slug);
    setExcerpt(p.excerpt ?? "");
    setContent(p.content);
    setCoverImage(p.coverImage ? { id: p.coverImage.id, url: p.coverImage.publicUrl, alt: p.coverImage.alt ?? "" } : null);
    setAuthorId(p.authorId ?? "");
    setCategoryIds(p.categories.map((c) => c.category.id));
    setTagIds(p.tags.map((t) => t.tag.id));
    setScheduledAt(p.scheduledAt ? p.scheduledAt.slice(0, 16) : "");
    setSeoTitle(p.seoMetadata?.seoTitle ?? "");
    setSeoDescription(p.seoMetadata?.seoDescription ?? "");
    setDirty(false);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!post) {
    return (
      <RequireAuth>
        <AdminShell>
          <p className="meta">Loading…</p>
        </AdminShell>
      </RequireAuth>
    );
  }

  async function saveDraft() {
    setSaving(true);
    try {
      await api(`/blog/${post!.id}`, {
        method: "PATCH",
        body: {
          title,
          slug,
          excerpt,
          content,
          coverImageId: (coverImage as { id: string } | null)?.id ?? null,
          authorId: authorId || null,
          categoryIds,
          tagIds,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          seo: { seoTitle, seoDescription },
        },
      });
      await load();
      setToast("Draft saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    const { url } = await api<{ url: string }>(`/blog/${post!.id}/preview-url`);
    window.open(url, "_blank");
  }

  async function handlePublish() {
    await saveDraft();
    await api(`/blog/${post!.id}/publish`, { method: "POST" });
    setPublishModal(false);
    await load();
    setToast("Published.");
  }

  async function handleUnpublish() {
    if (!confirm("Unpublish this post?")) return;
    await api(`/blog/${post!.id}/unpublish`, { method: "POST" });
    await load();
  }

  async function handleArchive() {
    if (!confirm("Archive this post?")) return;
    await api(`/blog/${post!.id}/archive`, { method: "POST" });
    await load();
  }

  async function openRevisions() {
    setRevisionsOpen(true);
    setRevisions(await api<Revision[]>(`/blog/${post!.id}/revisions`));
  }

  async function restoreRevision(version: number) {
    if (!confirm(`Restore version ${version} as draft?`)) return;
    await api(`/blog/${post!.id}/revisions/${version}/restore`, { method: "POST" });
    setRevisionsOpen(false);
    await load();
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setDirty(true);
  }
  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setDirty(true);
  }

  return (
    <RequireAuth>
      <AdminShell>
        <div className="admin-breadcrumb" style={{ marginBottom: 8 }}>
          <a href="/blog">Blog</a> / {post.title}
        </div>
        {dirty && <div className="unsaved-banner">You have unsaved changes.</div>}
        {toast && (
          <div className="admin-card" style={{ marginBottom: 16, background: "var(--cream-2)" }}>
            {toast} <button className="admin-btn admin-btn--sm admin-btn--ghost" onClick={() => setToast("")}>Dismiss</button>
          </div>
        )}

        <div className="admin-page-header">
          <div>
            <h1>{post.title}</h1>
            <StatusBadge status={post.status} hasUnpublishedChanges={hasUnpublishedChanges(post)} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="admin-btn" onClick={openRevisions}>Revisions</button>
            {post.status === "PUBLISHED" && (
              <a className="admin-btn" href={`${process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"}/blog/${post.slug}`} target="_blank" rel="noreferrer">
                View Live
              </a>
            )}
            <button className="admin-btn" onClick={handlePreview}>Preview Draft</button>
            <button className="admin-btn" onClick={handleArchive}>Archive</button>
            {post.status === "PUBLISHED" && (
              <button className="admin-btn admin-btn--danger" onClick={handleUnpublish}>Unpublish</button>
            )}
            <button className="admin-btn admin-btn--primary" onClick={saveDraft} disabled={saving}>
              {saving ? "Saving…" : "Save Draft"}
            </button>
            <button className="admin-btn admin-btn--gold" onClick={() => setPublishModal(true)}>Publish Changes</button>
          </div>
        </div>

        <div className="editor-shell">
          <div>
            <div className="admin-card" style={{ marginBottom: 16 }}>
              <div className="admin-field">
                <label className="admin-label">Title</label>
                <input className="admin-input" value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} />
              </div>
              <div className="admin-field">
                <label className="admin-label">Slug</label>
                <input className="admin-input" value={slug} onChange={(e) => { setSlug(e.target.value); setDirty(true); }} />
              </div>
              <div className="admin-field">
                <label className="admin-label">Excerpt</label>
                <textarea className="admin-textarea" rows={2} value={excerpt} onChange={(e) => { setExcerpt(e.target.value); setDirty(true); }} />
              </div>
            </div>

            <div className="admin-card">
              <label className="admin-label">Content</label>
              <TipTapEditor content={content} onChange={(doc) => { setContent(doc); setDirty(true); }} />
            </div>
          </div>

          <aside className="editor-sidebar">
            <div className="admin-card">
              <p className="admin-label">Cover Image</p>
              <MediaField value={coverImage} onChange={(m) => { setCoverImage(m); setDirty(true); }} label="" />
            </div>

            <div className="admin-card">
              <p className="admin-label">Author</p>
              <select className="admin-select" value={authorId} onChange={(e) => { setAuthorId(e.target.value); setDirty(true); }}>
                <option value="">— None —</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="admin-card">
              <p className="admin-label">Categories</p>
              {categories.map((c) => (
                <label key={c.id} className="admin-checkbox-row" style={{ marginBottom: 4 }}>
                  <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                  {c.name}
                </label>
              ))}
            </div>

            <div className="admin-card">
              <p className="admin-label">Tags</p>
              {tags.map((t) => (
                <label key={t.id} className="admin-checkbox-row" style={{ marginBottom: 4 }}>
                  <input type="checkbox" checked={tagIds.includes(t.id)} onChange={() => toggleTag(t.id)} />
                  {t.name}
                </label>
              ))}
              {tags.length === 0 && <p className="meta">No tags yet.</p>}
            </div>

            <div className="admin-card">
              <p className="admin-label">Schedule</p>
              <input type="datetime-local" className="admin-input" value={scheduledAt} onChange={(e) => { setScheduledAt(e.target.value); setDirty(true); }} />
              <p className="admin-hint">Leave blank to publish manually. If set, this post auto-publishes at this time (checked every minute).</p>
            </div>

            <div className="admin-card">
              <p className="admin-label">SEO</p>
              <div className="admin-field">
                <label className="admin-label">SEO Title</label>
                <input className="admin-input" value={seoTitle} onChange={(e) => { setSeoTitle(e.target.value); setDirty(true); }} />
              </div>
              <div className="admin-field">
                <label className="admin-label">SEO Description</label>
                <textarea className="admin-textarea" rows={2} value={seoDescription} onChange={(e) => { setSeoDescription(e.target.value); setDirty(true); }} />
              </div>
              <div style={{ border: "1px solid var(--rule-on-cream)", padding: 10, borderRadius: 4 }}>
                <p style={{ color: "#1a0dab", fontSize: 14, margin: 0 }}>{seoTitle || title}</p>
                <p style={{ color: "#006621", fontSize: 12, margin: "2px 0" }}>renasxgroup.com/blog/{slug}</p>
                <p style={{ fontSize: 12, color: "#545454", margin: 0 }}>{seoDescription || excerpt}</p>
              </div>
            </div>
          </aside>
        </div>

        {publishModal && (
          <div className="modal-overlay" onClick={() => setPublishModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>Publish Post</h3>
              <p><strong>Post:</strong> {title}</p>
              <p><strong>Current status:</strong> {post.status}</p>
              <p><strong>Last published:</strong> {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : "Never"}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="admin-btn admin-btn--gold" onClick={handlePublish}>Publish Changes</button>
                <button className="admin-btn admin-btn--ghost" onClick={() => setPublishModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {revisionsOpen && (
          <div className="modal-overlay" onClick={() => setRevisionsOpen(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>Revisions</h3>
              {!revisions ? <p className="meta">Loading…</p> : revisions.length === 0 ? <p className="meta">No revisions yet.</p> : (
                <table className="admin-table">
                  <thead><tr><th>Version</th><th>Editor</th><th>Timestamp</th><th></th></tr></thead>
                  <tbody>
                    {revisions.map((rev) => (
                      <tr key={rev.id}>
                        <td>v{rev.version}</td>
                        <td>{rev.editor?.name ?? "—"}</td>
                        <td className="meta">{new Date(rev.createdAt).toLocaleString()}</td>
                        <td><button className="admin-btn admin-btn--sm" onClick={() => restoreRevision(rev.version)}>Restore as Draft</button></td>
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
