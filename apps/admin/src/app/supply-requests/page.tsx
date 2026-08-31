"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api-client";
import type { SupplyRequest } from "@/lib/types";

const STATUS_OPTIONS = ["NEW", "REVIEWING", "CONTACTED", "QUALIFIED", "CLOSED", "SPAM"];

export default function SupplyRequestsPage() {
  const [items, setItems] = useState<SupplyRequest[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    const { items } = await api<{ items: SupplyRequest[]; total: number }>(`/supply-requests?${params}`);
    setItems(items);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  return (
    <RequireAuth>
      <AdminShell>
        <h1 style={{ marginBottom: 24 }}>Supply Requests</h1>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <input className="admin-input" style={{ maxWidth: 260 }} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="admin-select" style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <table className="admin-table">
          <thead>
            <tr><th>Date</th><th>Company</th><th>Contact</th><th>Product</th><th>Quantity</th><th>Destination</th><th>Status</th></tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td className="meta">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td>{r.companyName || "—"}</td>
                <td><Link href={`/supply-requests/${r.id}`}>{r.contactName}</Link></td>
                <td>{r.productName}</td>
                <td className="meta">{r.quantity ? `${r.quantity} ${r.unit ?? ""}` : "—"}</td>
                <td className="meta">{r.destination || "—"}</td>
                <td><span className={`admin-badge ${r.status === "NEW" ? "admin-badge--new" : "admin-badge--draft"}`}>{r.status}</span></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="meta">No supply requests match.</td></tr>}
          </tbody>
        </table>
      </AdminShell>
    </RequireAuth>
  );
}
