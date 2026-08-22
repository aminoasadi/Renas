"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api-client";
import type { DashboardSummary } from "@/lib/types";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api<DashboardSummary>("/dashboard").then(setSummary);
  }, []);

  return (
    <RequireAuth>
      <AdminShell>
        <div className="admin-page-header">
          <div>
            <h1>Dashboard</h1>
          </div>
        </div>

        {!summary ? (
          <p className="meta">Loading…</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
              <StatCard label="Published Pages" value={summary.publishedPages} href="/pages" />
              <StatCard label="Draft Pages" value={summary.draftPages} href="/pages" />
              <StatCard label="Published Posts" value={summary.publishedPosts} href="/blog" />
              <StatCard label="Draft Posts" value={summary.draftPosts} href="/blog" />
              <StatCard label="New Supply Requests" value={summary.newSupplyRequests} href="/supply-requests" highlight />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <h2 style={{ fontSize: 16, marginBottom: 12 }}>Recent Contact Submissions</h2>
                <div className="admin-card">
                  {summary.recentContactSubmissions.length === 0 && <p className="meta">None yet.</p>}
                  {summary.recentContactSubmissions.map((c) => (
                    <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--rule-on-cream)" }}>
                      <Link href={`/contact-submissions/${c.id}`}>{c.name}</Link> — {c.subject || "(no subject)"}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 style={{ fontSize: 16, marginBottom: 12 }}>Recent CMS Activity</h2>
                <div className="admin-card">
                  {summary.recentActivity.length === 0 && <p className="meta">None yet.</p>}
                  {summary.recentActivity.map((a) => (
                    <div key={a.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--rule-on-cream)", fontSize: 13 }}>
                      <strong>{a.action}</strong> — {a.user?.name ?? "system"} — {new Date(a.createdAt).toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </AdminShell>
    </RequireAuth>
  );
}

function StatCard({ label, value, href, highlight }: { label: string; value: number; href: string; highlight?: boolean }) {
  return (
    <Link href={href} className="admin-card" style={{ display: "block", textDecoration: "none" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: highlight && value > 0 ? "var(--gold)" : "var(--charcoal)" }}>{value}</div>
      <div className="meta">{label}</div>
    </Link>
  );
}
