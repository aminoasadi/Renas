"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api-client";
import type { ContactSubmission } from "@/lib/types";

export default function ContactSubmissionsPage() {
  const [items, setItems] = useState<ContactSubmission[]>([]);

  useEffect(() => {
    api<{ items: ContactSubmission[] }>("/contact-submissions").then((r) => setItems(r.items));
  }, []);

  return (
    <RequireAuth>
      <AdminShell>
        <h1 style={{ marginBottom: 24 }}>Contact Submissions</h1>
        <table className="admin-table">
          <thead><tr><th>Date</th><th>Name</th><th>Email</th><th>Subject</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td className="meta">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td><Link href={`/contact-submissions/${c.id}`}>{c.name}</Link></td>
                <td className="meta">{c.email}</td>
                <td>{c.subject || "—"}</td>
                <td><span className={`admin-badge ${c.status === "NEW" ? "admin-badge--new" : "admin-badge--draft"}`}>{c.status}</span></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="meta">No submissions yet.</td></tr>}
          </tbody>
        </table>
      </AdminShell>
    </RequireAuth>
  );
}
