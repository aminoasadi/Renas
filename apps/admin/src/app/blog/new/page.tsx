"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { api, ApiError } from "@/lib/api-client";
import type { AdminBlogPost } from "@/lib/types";

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function NewBlogPostForm() {
  const searchParams = useSearchParams();
  const initialLocale = searchParams.get("locale") === "fa" ? "fa" : "en";
  const initialSlug = searchParams.get("slug") ?? "";

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState(initialSlug);
  const [slugTouched, setSlugTouched] = useState(initialSlug !== "");
  const [locale, setLocale] = useState<"en" | "fa">(initialLocale);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const post = await api<AdminBlogPost>("/blog", { method: "POST", body: { title, slug: slug || slugify(title), locale } });
      router.push(`/blog/${post.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create post.");
      setSaving(false);
    }
  }

  return (
    <RequireAuth>
      <AdminShell>
        <div className="admin-breadcrumb" style={{ marginBottom: 8 }}>
          <Link href="/blog">Blog</Link> / New Post
        </div>
        <h1 style={{ marginBottom: 24 }}>New Post</h1>
        <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: 480 }}>
          {error && <div className="admin-error-text" style={{ marginBottom: 16 }}>{error}</div>}
          <div className="admin-field">
            <label className="admin-label">Locale</label>
            <select className="admin-select" value={locale} onChange={(e) => setLocale(e.target.value as "en" | "fa")}>
              <option value="en">English</option>
              <option value="fa">فارسی (Persian)</option>
            </select>
          </div>
          <div className="admin-field">
            <label className="admin-label">Title</label>
            <input
              className="admin-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
              autoFocus
            />
          </div>
          <div className="admin-field">
            <label className="admin-label">Slug</label>
            <input className="admin-input" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} required />
            <p className="admin-hint">/{locale}/blog/{slug}</p>
          </div>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? "Creating…" : "Create Post"}
          </button>
        </form>
      </AdminShell>
    </RequireAuth>
  );
}

export default function NewBlogPostPage() {
  return (
    <Suspense fallback={null}>
      <NewBlogPostForm />
    </Suspense>
  );
}
