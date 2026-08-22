"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api-client";
import { hasUnpublishedChanges } from "@/lib/content-state";
import type { AdminBlogPost } from "@/lib/types";

export default function BlogListPage() {
  const [posts, setPosts] = useState<AdminBlogPost[] | null>(null);

  useEffect(() => {
    api<AdminBlogPost[]>("/blog").then(setPosts);
  }, []);

  return (
    <RequireAuth>
      <AdminShell>
        <div className="admin-page-header">
          <h1>Blog</h1>
          <Link href="/blog/new" className="admin-btn admin-btn--primary">
            + New Post
          </Link>
        </div>

        {!posts ? (
          <p className="meta">Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Author</th>
                <th>Categories</th>
                <th>Published At</th>
                <th>Updated At</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <Link href={`/blog/${post.id}`}>{post.title}</Link>
                  </td>
                  <td>
                    <StatusBadge status={post.status} hasUnpublishedChanges={hasUnpublishedChanges(post)} />
                  </td>
                  <td className="meta">{post.author?.name ?? "—"}</td>
                  <td className="meta">{post.categories.map((c) => c.category.name).join(", ") || "—"}</td>
                  <td className="meta">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"}</td>
                  <td className="meta">{new Date(post.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="meta">
                    No posts yet.
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
