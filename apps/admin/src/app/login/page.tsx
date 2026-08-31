"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { refresh } = useAuth();
  const router = useRouter();

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api("/auth/login", { method: "POST", body: { username, password } });
      await refresh();
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("Too many attempts. Please wait a while before trying again.");
      } else {
        setError("Invalid username or password.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--charcoal)" }}>
      <div className="admin-card" style={{ width: 380, background: "white" }}>
        <p style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", letterSpacing: "var(--ls-wide)", fontSize: 14, marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/renas-mark.png" alt="" style={{ height: 20, width: "auto" }} />
          RENAS<span style={{ color: "var(--gold)" }}>.</span> CMS
        </p>

        {error && <div className="admin-error-text" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={login}>
          <div className="admin-field">
            <label className="admin-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="admin-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="admin-btn admin-btn--primary" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "SIGNING IN…" : "SIGN IN"}
          </button>
        </form>
      </div>
    </div>
  );
}
