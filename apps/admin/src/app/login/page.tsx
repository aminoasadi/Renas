"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/AuthContext";

type Stage = "email" | "otp-sent" | "verifying" | "rate-limited";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<Stage>("email");
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const { refresh } = useAuth();
  const router = useRouter();

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setRequesting(true);
    try {
      await api("/auth/otp/request", { method: "POST", body: { email } });
      setStage("otp-sent");
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setStage("rate-limited");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setRequesting(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStage("verifying");
    try {
      await api("/auth/otp/verify", { method: "POST", body: { email, code } });
      await refresh();
      router.push("/dashboard");
    } catch (err) {
      setStage("otp-sent");
      if (err instanceof ApiError) {
        if (err.message.toLowerCase().includes("expired")) {
          setError("This code has expired. Request a new one.");
        } else if (err.message.toLowerCase().includes("too many")) {
          setError("Too many incorrect attempts. Request a new code.");
        } else {
          setError("Invalid code. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--charcoal)" }}>
      <div className="admin-card" style={{ width: 380, background: "white" }}>
        <p style={{ fontFamily: "var(--font-mono)", letterSpacing: "var(--ls-wide)", fontSize: 14, marginBottom: 24 }}>
          RENAS<span style={{ color: "var(--gold)" }}>.</span> CMS
        </p>

        {stage === "rate-limited" && (
          <div className="admin-error-text" style={{ marginBottom: 16 }}>
            Too many login code requests. Please wait a while before trying again.
          </div>
        )}

        {error && <div className="admin-error-text" style={{ marginBottom: 16 }}>{error}</div>}

        {stage === "email" || stage === "rate-limited" ? (
          <form onSubmit={requestOtp}>
            <div className="admin-field">
              <label className="admin-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="admin-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="admin-btn admin-btn--primary" style={{ width: "100%" }} disabled={requesting}>
              {requesting ? "SENDING…" : "SEND LOGIN CODE"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp}>
            <p className="admin-hint" style={{ marginBottom: 16 }}>
              We sent a 6-digit code to <strong>{email}</strong>. It expires in 5 minutes.
            </p>
            <div className="admin-field">
              <label className="admin-label" htmlFor="code">
                Login code
              </label>
              <input
                id="code"
                inputMode="numeric"
                pattern="[0-9]*"
                className="admin-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="admin-btn admin-btn--primary" style={{ width: "100%" }} disabled={stage === "verifying"}>
              {stage === "verifying" ? "VERIFYING…" : "VERIFY & LOG IN"}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              style={{ width: "100%", marginTop: 8 }}
              onClick={() => {
                setStage("email");
                setCode("");
                setError("");
              }}
            >
              USE A DIFFERENT EMAIL
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
