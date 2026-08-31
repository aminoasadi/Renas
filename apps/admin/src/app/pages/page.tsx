"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api-client";
import { hasUnpublishedChanges } from "@/lib/content-state";
import type { AdminPage } from "@/lib/types";

export default function PagesListPage() {
  const [pages, setPages] = useState<AdminPage[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    api<AdminPage[]>("/pages").then(setPages);
  }, []);

  const filtered = useMemo(() => {
    if (!pages) return [];
    return pages.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.slug.includes(search.toLowerCase())) return false;
      return true;
    });
  }, [pages, search, statusFilter]);

  return (
    <RequireAuth>
      <AdminShell>
        <div className="admin-page-header">
          <h1>Pages</h1>
          <Link href="/pages/new" className="admin-btn admin-btn--primary">
            + New Page
          </Link>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <input className="admin-input" style={{ maxWidth: 260 }} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="admin-select" style={{ maxWidth: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {!pages ? (
          <p className="meta">Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Locale</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Published At</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((page) => (
                <tr key={page.id}>
                  <td>
                    <Link href={`/pages/${page.id}`}>{page.title}</Link>
                  </td>
                  <td className="meta">/{page.slug === "home" ? "" : page.slug}</td>
                  <td>
                    <span className="admin-badge">{page.locale === "fa" ? "فارسی" : "English"}</span>
                  </td>
                  <td>
                    <StatusBadge status={page.status} hasUnpublishedChanges={hasUnpublishedChanges(page)} />
                  </td>
                  <td className="meta">{new Date(page.updatedAt).toLocaleString()}</td>
                  <td className="meta">{page.publishedAt ? new Date(page.publishedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="meta">
                    No pages match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </AdminShell>
    </RequireAuth>
  );
}
