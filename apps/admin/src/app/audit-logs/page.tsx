"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api-client";
import type { AuditLogEntry } from "@/lib/types";

export default function AuditLogsPage() {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    api<{ items: AuditLogEntry[] }>("/audit-logs?perPage=100").then((r) => setItems(r.items));
  }, []);

  const filtered = actionFilter ? items.filter((i) => i.action === actionFilter) : items;
  const actions = Array.from(new Set(items.map((i) => i.action))).sort();

  return (
    <RequireAuth role="SUPER_ADMIN">
      <AdminShell>
        <h1 style={{ marginBottom: 24 }}>Audit Log</h1>

        <select className="admin-select" style={{ maxWidth: 240, marginBottom: 16 }} value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <table className="admin-table">
          <thead><tr><th>Date</th><th>User</th><th>Action</th><th>Entity</th><th>IP</th></tr></thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id}>
                <td className="meta">{new Date(entry.createdAt).toLocaleString()}</td>
                <td>{entry.user?.name ?? "system"}</td>
                <td>{entry.action}</td>
                <td className="meta">{entry.entityType ? `${entry.entityType}${entry.entityId ? ` #${entry.entityId.slice(0, 8)}` : ""}` : "—"}</td>
                <td className="meta">{entry.ipAddress ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="meta">No activity recorded.</td></tr>}
          </tbody>
        </table>
      </AdminShell>
    </RequireAuth>
  );
}
