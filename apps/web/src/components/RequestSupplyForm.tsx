"use client";

import { useEffect, useRef, useState } from "react";
import { clientConfig as config } from "@/lib/client-config";
import { trackEvent } from "@/lib/analytics";

type FieldErrors = Record<string, string>;

const DESTINATIONS = ["IRAN", "KURDISTAN REGION", "IRAQ", "OTHER"];
const TIMELINES = ["URGENT", "WITHIN 30 DAYS", "PLANNED PURCHASE", "NOT SURE"];

export function RequestSupplyForm() {
  const [values, setValues] = useState({
    productName: "",
    brand: "",
    partNumber: "",
    quantity: "",
    unit: "",
    category: "",
    originPreference: "",
    destination: "",
    requiredBy: "",
    contactName: "",
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    contactChannel: "",
    message: "",
  });
  const [attachment, setAttachment] = useState<{ id: string; publicUrl: string; name: string } | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const startedRef = useRef(false);
  const utmRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    utmRef.current = {
      utmSource: params.get("utm_source") ?? "",
      utmMedium: params.get("utm_medium") ?? "",
      utmCampaign: params.get("utm_campaign") ?? "",
      utmContent: params.get("utm_content") ?? "",
      utmTerm: params.get("utm_term") ?? "",
      referrer: document.referrer ?? "",
    };
  }, []);

  function set<K extends keyof typeof values>(key: K, value: string) {
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent("rfq_started");
    }
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleAttachment(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttaching(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${config.apiUrl}/api/v1/public/supply-requests/attachment`, {
        method: "POST",
        body: formData,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Upload failed");
      setAttachment({ id: body.data.id, publicUrl: body.data.publicUrl, name: file.name });
    } catch {
      setErrors((prev) => ({ ...prev, attachment: "Could not upload this file. Try a smaller image or PDF." }));
    } finally {
      setAttaching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return; // guards against rapid double-click

    setStatus("submitting");
    setErrors({});
    setErrorMessage("");

    try {
      const res = await fetch(`${config.apiUrl}/api/v1/public/supply-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          requiredBy: values.requiredBy ? new Date(values.requiredBy).toISOString() : undefined,
          attachmentMediaId: attachment?.id,
          source: "website",
          ...utmRef.current,
          honeypot: "",
        }),
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
        return; // form values are preserved — never cleared on failure
      }

      trackEvent("rfq_submitted");
      setStatus("success");
    } catch {
      setErrorMessage("Could not reach the server. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="container" style={{ paddingBlock: "var(--sp-9)" }}>
        <div className="m-form-banner m-form-banner--success">Request received. Our team will follow up shortly.</div>
      </div>
    );
  }

  return (
    <section className="m-composer section--teal" aria-label="Build your requirement">
      <div className="container">
        <p className="eyebrow" style={{ color: "var(--cream)" }}>
          REQUEST SUPPLY
        </p>
        <h2 className="m-composer__headline headline">Build your requirement.</h2>
        <p className="body-lg">Start with what you know. The RENAS team can help clarify the rest.</p>

        <form className="m-composer__panel" onSubmit={handleSubmit} noValidate>
          {status === "error" && <div className="m-form-banner m-form-banner--error">{errorMessage}</div>}

          <div className="m-composer__step is-active">
            <p className="m-composer__q">WHAT DO YOU NEED?</p>
            <input
              className="m-composer__input"
              placeholder="Brake Disc"
              value={values.productName}
              onChange={(e) => set("productName", e.target.value)}
              required
              aria-invalid={Boolean(errors.productName)}
              aria-describedby={errors.productName ? "err-productName" : undefined}
            />
            {errors.productName && (
              <p className="m-field-error" id="err-productName">
                {errors.productName}
              </p>
            )}
          </div>

          <div className="m-composer__step is-active" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-5)" }}>
            <div>
              <p className="m-composer__q">BRAND</p>
              <input className="m-composer__input" value={values.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
            <div>
              <p className="m-composer__q">PART NUMBER</p>
              <input className="m-composer__input" value={values.partNumber} onChange={(e) => set("partNumber", e.target.value)} />
            </div>
          </div>

          <div className="m-composer__step is-active m-composer__qty">
            <div>
              <p className="m-composer__q">QUANTITY</p>
              <input
                className="m-composer__input m-composer__input--qty"
                value={values.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </div>
            <div>
              <p className="m-composer__q">UNIT</p>
              <input
                className="m-composer__input m-composer__input--unit"
                placeholder="units"
                value={values.unit}
                onChange={(e) => set("unit", e.target.value)}
              />
            </div>
          </div>

          <div className="m-composer__step is-active">
            <p className="m-composer__q">DESTINATION</p>
            <div className="m-composer__choices">
              {DESTINATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`m-choice${values.destination === d ? " is-selected" : ""}`}
                  onClick={() => set("destination", d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="m-composer__step is-active">
            <p className="m-composer__q">WHEN DO YOU NEED IT?</p>
            <div className="m-composer__choices">
              {TIMELINES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`m-choice${values.contactChannel === t ? " is-selected" : ""}`}
                  onClick={() => set("contactChannel", t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="m-composer__step is-active">
            <p className="m-composer__q">ATTACHMENT (OPTIONAL)</p>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleAttachment} disabled={attaching} />
            {attaching && <p className="meta">Uploading…</p>}
            {attachment && <p className="meta">Attached: {attachment.name}</p>}
            {errors.attachment && <p className="m-field-error">{errors.attachment}</p>}
          </div>

          <div className="m-composer__step is-active" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-5)" }}>
            <div>
              <p className="m-composer__q">YOUR NAME</p>
              <input
                className="m-composer__input"
                value={values.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                required
                aria-invalid={Boolean(errors.contactName)}
              />
              {errors.contactName && <p className="m-field-error">{errors.contactName}</p>}
            </div>
            <div>
              <p className="m-composer__q">COMPANY</p>
              <input className="m-composer__input" value={values.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </div>
          </div>

          <div className="m-composer__step is-active" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-5)" }}>
            <div>
              <p className="m-composer__q">EMAIL</p>
              <input
                type="email"
                className="m-composer__input"
                value={values.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                aria-invalid={Boolean(errors.contactEmail)}
              />
              {errors.contactEmail && <p className="m-field-error">{errors.contactEmail}</p>}
            </div>
            <div>
              <p className="m-composer__q">PHONE</p>
              <input className="m-composer__input" value={values.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
            </div>
          </div>

          <div className="m-composer__step is-active">
            <p className="m-composer__q">ANYTHING ELSE?</p>
            <textarea
              className="m-composer__input"
              rows={3}
              value={values.message}
              onChange={(e) => set("message", e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Honeypot — real users never see or fill this in; bots that autofill every field will. */}
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px" }} aria-hidden="true" />

          {config.turnstileSiteKey ? (
            <div data-turnstile-sitekey={config.turnstileSiteKey} />
          ) : (
            process.env.NODE_ENV !== "production" && <p className="meta">Turnstile disabled locally.</p>
          )}

          <div className="m-composer__nav">
            <button type="submit" className="btn btn--primary" disabled={status === "submitting"}>
              {status === "submitting" ? "SUBMITTING…" : "SUBMIT REQUEST"} <span className="arrow">↗</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
