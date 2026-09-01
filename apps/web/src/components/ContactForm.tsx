"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

type FieldErrors = Record<string, string>;

const COPY = {
  en: {
    name: "NAME",
    company: "COMPANY",
    email: "EMAIL",
    phone: "PHONE",
    subject: "SUBJECT",
    message: "MESSAGE",
    send: "SEND MESSAGE",
    sending: "SENDING…",
    success: "Message sent. We’ll get back to you shortly.",
    genericError: "Something went wrong. Please try again.",
    networkError: "Could not reach the server. Please check your connection and try again.",
  },
  fa: {
    name: "نام",
    company: "شرکت",
    email: "ایمیل",
    phone: "تلفن",
    subject: "موضوع",
    message: "پیام",
    send: "ارسال پیام",
    sending: "در حال ارسال…",
    success: "پیام شما ارسال شد. به‌زودی پاسخ می‌دهیم.",
    genericError: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
    networkError: "امکان اتصال به سرور نبود. اتصال اینترنت خود را بررسی و دوباره تلاش کنید.",
  },
};

export function ContactForm({ locale = "en" as Locale }: { locale?: Locale }) {
  const t = COPY[locale];
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
      const res = await fetch(`/api/v1/public/contact-submissions`, {
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
        setErrorMessage(body?.error?.message ?? t.genericError);
        setStatus("error");
        return;
      }

      trackEvent("contact_submitted");
      setStatus("success");
    } catch {
      setErrorMessage(t.networkError);
      setStatus("error");
    }
  }

  // Page chrome (section, container, headline) belongs to the route that
  // renders this — the contact page composes it beside a statement column,
  // so the form owns nothing but itself.
  if (status === "success") {
    return <div className="m-form-banner m-form-banner--success">{t.success}</div>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
          {status === "error" && <div className="m-form-banner m-form-banner--error">{errorMessage}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-5)", marginBottom: "var(--sp-5)" }}>
            <div>
              <label className="meta">{t.name}</label>
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
              <label className="meta">{t.company}</label>
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
              <label className="meta">{t.email}</label>
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
              <label className="meta">{t.phone}</label>
              <input
                className="m-composer__input"
                style={{ color: "var(--charcoal)", borderColor: "var(--rule-on-cream)" }}
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: "var(--sp-5)" }}>
            <label className="meta">{t.subject}</label>
            <input
              className="m-composer__input"
              style={{ color: "var(--charcoal)", borderColor: "var(--rule-on-cream)" }}
              value={values.subject}
              onChange={(e) => set("subject", e.target.value)}
            />
          </div>

          <div style={{ marginBottom: "var(--sp-6)" }}>
            <label className="meta">{t.message}</label>
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
            {status === "submitting" ? t.sending : t.send} <span className="arrow">↗</span>
          </button>
    </form>
  );
}
