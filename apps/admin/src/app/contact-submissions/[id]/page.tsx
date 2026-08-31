"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api-client";
import type { ContactSubmission } from "@/lib/types";

export default function ContactSubmissionDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<ContactSubmission | null>(null);

  const load = useCallback(async () => {
    setItem(await api<ContactSubmission>(`/contact-submissions/${params.id}`));
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!item) {
    return (
      <RequireAuth>
        <AdminShell>
          <p className="meta">Loading…</p>
        </AdminShell>
      </RequireAuth>
    );
  }

  async function setStatus(status: "HANDLED" | "SPAM" | "NEW") {
    await api(`/contact-submissions/${item!.id}/status`, { method: "PATCH", body: { status } });
    await load();
  }

  return (
    <RequireAuth>
      <AdminShell>
        <div className="admin-breadcrumb" style={{ marginBottom: 8 }}>
          <Link href="/contact-submissions">Contact Submissions</Link> / {item.name}
        </div>
        <h1 style={{ marginBottom: 24 }}>{item.name}</h1>

        <div className="admin-card" style={{ maxWidth: 600 }}>
          <p><strong>Email:</strong> {item.email}</p>
          {item.company && <p><strong>Company:</strong> {item.company}</p>}
          {item.phone && <p><strong>Phone:</strong> {item.phone}</p>}
          {item.subject && <p><strong>Subject:</strong> {item.subject}</p>}
          <p style={{ whiteSpace: "pre-wrap" }}><strong>Message:</strong><br />{item.message}</p>
          <p className="meta">Received {new Date(item.createdAt).toLocaleString()}</p>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="admin-btn admin-btn--primary" onClick={() => setStatus("HANDLED")}>Mark Handled</button>
            <button className="admin-btn admin-btn--danger" onClick={() => setStatus("SPAM")}>Mark Spam</button>
          </div>
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
