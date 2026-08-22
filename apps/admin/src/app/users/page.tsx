"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { api, ApiError } from "@/lib/api-client";
import type { CurrentUser } from "@/lib/types";

export default function UsersPage() {
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"EDITOR" | "SUPER_ADMIN">("EDITOR");
  const [error, setError] = useState("");

  async function load() {
    setUsers(await api<CurrentUser[]>("/users"));
  }
  useEffect(() => {
    load();
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/users", { method: "POST", body: { email, name, role } });
      setEmail("");
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create user.");
    }
  }

  async function toggleStatus(user: CurrentUser) {
    const action = user.status === "ACTIVE" ? "disable" : "enable";
    if (action === "disable" && !confirm(`Disable ${user.email}? Their active sessions will be revoked immediately.`)) return;
    await api(`/users/${user.id}/${action}`, { method: "PATCH" });
    await load();
  }

  return (
    <RequireAuth role="SUPER_ADMIN">
      <AdminShell>
        <h1 style={{ marginBottom: 24 }}>Users</h1>

        <form onSubmit={createUser} className="admin-card" style={{ marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr 140px auto", gap: 12, alignItems: "end" }}>
          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label className="admin-label">Email</label>
            <input className="admin-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label className="admin-label">Name</label>
            <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label className="admin-label">Role</label>
            <select className="admin-select" value={role} onChange={(e) => setRole(e.target.value as "EDITOR" | "SUPER_ADMIN")}>
              <option value="EDITOR">Editor</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          <button type="submit" className="admin-btn admin-btn--primary">Create User</button>
        </form>
        {error && <p className="admin-error-text" style={{ marginBottom: 16 }}>{error}</p>}

        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td className="meta">{u.email}</td>
                <td>{u.role}</td>
                <td><span className={`admin-badge ${u.status === "ACTIVE" ? "admin-badge--published" : "admin-badge--archived"}`}>{u.status}</span></td>
                <td className="meta">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}</td>
                <td>
                  <button className="admin-btn admin-btn--sm" onClick={() => toggleStatus(u)}>
                    {u.status === "ACTIVE" ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminShell>
    </RequireAuth>
  );
}
