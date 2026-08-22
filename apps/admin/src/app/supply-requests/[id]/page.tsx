"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api-client";
import type { SupplyRequest } from "@/lib/types";

const STATUS_OPTIONS = ["NEW", "REVIEWING", "CONTACTED", "QUALIFIED", "CLOSED", "SPAM"];

export default function SupplyRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<SupplyRequest | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setRequest(await api<SupplyRequest>(`/supply-requests/${params.id}`));
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!request) {
    return (
      <RequireAuth>
        <AdminShell>
          <p className="meta">Loading…</p>
        </AdminShell>
      </RequireAuth>
    );
  }

  async function updateStatus(status: string) {
    await api(`/supply-requests/${request!.id}/status`, { method: "PATCH", body: { status } });
    await load();
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    await api(`/supply-requests/${request!.id}/notes`, { method: "POST", body: { note } });
    setNote("");
    await load();
  }

  const fields: Array<[string, string | null]> = [
    ["Product", request.productName],
    ["Brand", request.brand],
    ["Part Number", request.partNumber],
    ["Quantity", request.quantity ? `${request.quantity} ${request.unit ?? ""}` : null],
    ["Category", request.category],
    ["Origin Preference", request.originPreference],
    ["Destination", request.destination],
    ["Required By", request.requiredBy ? new Date(request.requiredBy).toLocaleDateString() : null],
    ["Contact Name", request.contactName],
    ["Company", request.companyName],
    ["Email", request.contactEmail],
    ["Phone", request.contactPhone],
    ["Preferred Channel", request.contactChannel],
    ["Message", request.message],
  ];

  const utmFields: Array<[string, string | null]> = [
    ["Source", request.source],
    ["UTM Source", request.utmSource],
    ["UTM Medium", request.utmMedium],
    ["UTM Campaign", request.utmCampaign],
    ["Referrer", request.referrer],
  ];

  return (
    <RequireAuth>
      <AdminShell>
        <div className="admin-breadcrumb" style={{ marginBottom: 8 }}>
          <a href="/supply-requests">Supply Requests</a> / {request.contactName}
        </div>
        <div className="admin-page-header">
          <h1>{request.productName}</h1>
          <select className="admin-select" value={request.status} onChange={(e) => updateStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div className="admin-card">
            <h2 style={{ fontSize: 16, marginTop: 0 }}>Submitted Details</h2>
            {fields.map(([label, value]) => value && (
              <p key={label}><strong>{label}:</strong> {value}</p>
            ))}
            {request.attachment && (
              <p>
                <strong>Attachment:</strong>{" "}
                <a href={request.attachment.publicUrl} target="_blank" rel="noreferrer">
                  {request.attachment.originalFilename}
                </a>
              </p>
            )}

            <h3 style={{ fontSize: 13, marginTop: 20 }}>Source Metadata</h3>
            {utmFields.map(([label, value]) => value && (
              <p key={label} className="meta">{label}: {value}</p>
            ))}
          </div>

          <div>
            <div className="admin-card">
              <h2 style={{ fontSize: 16, marginTop: 0 }}>Internal Notes</h2>
              <p className="admin-hint">Never visible to the public.</p>
              {request.notes.map((n) => (
                <div key={n.id} style={{ borderTop: "1px solid var(--rule-on-cream)", padding: "8px 0" }}>
                  <p style={{ margin: 0 }}>{n.note}</p>
                  <p className="meta">{n.author?.name ?? "—"} · {new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
              <form onSubmit={addNote} style={{ marginTop: 12 }}>
                <textarea className="admin-textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…" />
                <button type="submit" className="admin-btn admin-btn--sm" style={{ marginTop: 8 }}>Add Note</button>
              </form>
            </div>
          </div>
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
