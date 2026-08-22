"use client";

import { useState } from "react";
import { clientConfig as config } from "@/lib/client-config";
import { trackEvent } from "@/lib/analytics";

type FieldErrors = Record<string, string>;

export function ContactForm() {
  const [values, setValues] = useState({ name: "", company: "", email: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setErrors({});
    setErrorMessage("");

    try {
      const res = await fetch(`${config.apiUrl}/api/v1/public/contact-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, honeypot: "" }),
      });
      const body = await res.json();

      if (!res.ok) {
        if (body?.error?.code === "VALIDATION_ERROR" && Array.isArray(body.error.details)) {
          const fieldErrors: FieldErrors = {};
          for (const detail of body.error.details) {
            if (detail.path) fieldErrors[detail.path] = detail.message;
          }
          setErrors(fieldErrors);
        }
        setErrorMessage(body?.error?.message ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      trackEvent("contact_submitted");
      setStatus("success");
    } catch {
      setErrorMessage("Could not reach the server. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="container" style={{ paddingBlock: "var(--sp-9)" }}>
        <div className="m-form-banner m-form-banner--success">Message sent. We'll get back to you shortly.</div>
      </div>
    );
  }

  return (
    <section className="section section--cream">
      <div className="container" style={{ maxWidth: "640px" }}>
        <p className="eyebrow">CONTACT</p>
        <h2 className="headline" style={{ fontSize: "var(--fs-h2)", margin: "var(--sp-4) 0 var(--sp-7)" }}>
          Get in touch.
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          {status === "error" && <div className="m-form-banner m-form-banner--error">{errorMessage}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-5)", marginBottom: "var(--sp-5)" }}>
            <div>
              <label className="meta">NAME</label>
              <input
                className="m-composer__input"
                style={{ color: "var(--charcoal)", borderColor: "var(--rule-on-cream)" }}
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
              {errors.name && <p className="m-field-error">{errors.name}</p>}
            </div>
            <div>
              <label className="meta">COMPANY</label>
              <input
                className="m-composer__input"
                style={{ color: "var(--charcoal)", borderColor: "var(--rule-on-cream)" }}
                value={values.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-5)", marginBottom: "var(--sp-5)" }}>
            <div>
              <label className="meta">EMAIL</label>
              <input
                type="email"
                className="m-composer__input"
                style={{ color: "var(--charcoal)", borderColor: "var(--rule-on-cream)" }}
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
              {errors.email && <p className="m-field-error">{errors.email}</p>}
            </div>
            <div>
              <label className="meta">PHONE</label>
              <input
                className="m-composer__input"
                style={{ color: "var(--charcoal)", borderColor: "var(--rule-on-cream)" }}
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: "var(--sp-5)" }}>
            <label className="meta">SUBJECT</label>
            <input
              className="m-composer__input"
              style={{ color: "var(--charcoal)", borderColor: "var(--rule-on-cream)" }}
              value={values.subject}
              onChange={(e) => set("subject", e.target.value)}
            />
          </div>

          <div style={{ marginBottom: "var(--sp-6)" }}>
            <label className="meta">MESSAGE</label>
            <textarea
              className="m-composer__input"
              style={{ color: "var(--charcoal)", borderColor: "var(--rule-on-cream)", resize: "vertical" }}
              rows={5}
              value={values.message}
              onChange={(e) => set("message", e.target.value)}
              required
            />
            {errors.message && <p className="m-field-error">{errors.message}</p>}
          </div>

          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px" }} aria-hidden="true" />

          <button type="submit" className="btn btn--primary" disabled={status === "submitting"}>
            {status === "submitting" ? "SENDING…" : "SEND MESSAGE"} <span className="arrow">↗</span>
          </button>
        </form>
      </div>
    </section>
  );
}
