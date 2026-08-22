"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { api, ApiError } from "@/lib/api-client";
import type { Redirect } from "@/lib/types";

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [sourcePath, setSourcePath] = useState("");
  const [destinationPath, setDestinationPath] = useState("");
  const [statusCode, setStatusCode] = useState<301 | 302>(301);
  const [error, setError] = useState("");

  async function load() {
    setRedirects(await api<Redirect[]>("/redirects"));
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (sourcePath === destinationPath) {
      setError("Source and destination must differ (this would create a redirect loop).");
      return;
    }
    try {
      await api("/redirects", { method: "POST", body: { sourcePath, destinationPath, statusCode } });
      setSourcePath("");
      setDestinationPath("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create redirect.");
    }
  }

  async function toggleActive(r: Redirect) {
    await api(`/redirects/${r.id}`, { method: "PATCH", body: { isActive: !r.isActive } });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this redirect?")) return;
    await api(`/redirects/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <RequireAuth role="SUPER_ADMIN">
      <AdminShell>
        <h1 style={{ marginBottom: 24 }}>Redirects</h1>

        <form onSubmit={create} className="admin-card" style={{ marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 12, alignItems: "end" }}>
          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label className="admin-label">Source Path</label>
            <input className="admin-input" placeholder="/old-page" value={sourcePath} onChange={(e) => setSourcePath(e.target.value)} required />
          </div>
          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label className="admin-label">Destination Path</label>
            <input className="admin-input" placeholder="/new-page" value={destinationPath} onChange={(e) => setDestinationPath(e.target.value)} required />
          </div>
          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label className="admin-label">Status</label>
            <select className="admin-select" value={statusCode} onChange={(e) => setStatusCode(Number(e.target.value) as 301 | 302)}>
              <option value={301}>301</option>
              <option value={302}>302</option>
            </select>
          </div>
          <button type="submit" className="admin-btn admin-btn--primary">Add</button>
        </form>
        {error && <p className="admin-error-text" style={{ marginBottom: 16 }}>{error}</p>}

        <table className="admin-table">
          <thead><tr><th>Source</th><th>Destination</th><th>Status</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {redirects.map((r) => (
              <tr key={r.id}>
                <td className="meta">{r.sourcePath}</td>
                <td className="meta">{r.destinationPath}</td>
                <td>{r.statusCode}</td>
                <td>
                  <label className="admin-checkbox-row">
                    <input type="checkbox" checked={r.isActive} onChange={() => toggleActive(r)} />
                  </label>
                </td>
                <td>
                  <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => remove(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {redirects.length === 0 && <tr><td colSpan={5} className="meta">No redirects configured.</td></tr>}
          </tbody>
        </table>
      </AdminShell>
    </RequireAuth>
  );
}
