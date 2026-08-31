"use client";

import { useEffect, useRef, useState } from "react";
import { clientConfig as config } from "@/lib/client-config";
import { trackEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

type FieldErrors = Record<string, string>;

const STEPS = ["product", "part", "quantity", "destination", "timeline", "attachment", "contact", "summary"] as const;
type Step = (typeof STEPS)[number];

const COPY = {
  en: {
    eyebrow: "10 / REQUIREMENT COMPOSER",
    headline: "Build your requirement.",
    body: "Start with what you know. The RENAS team can help clarify the rest.",
    destinations: ["IRAN", "KURDISTAN REGION", "IRAQ", "OTHER"],
    timelines: ["URGENT", "WITHIN 30 DAYS", "PLANNED PURCHASE", "NOT SURE"],
    productRequired: "Tell us what you need before continuing.",
    uploadFailed: "Could not upload this file. Try a smaller image or PDF.",
    genericError: "Something went wrong. Please try again.",
    networkError: "Could not reach the server. Please check your connection and try again.",
    success: "Request received. Our team will follow up shortly.",
    q1: "01 / WHAT DO YOU NEED?",
    productPlaceholder: "Brake Disc",
    q2brand: "02 / BRAND",
    q2part: "PART NUMBER",
    partPlaceholder: "e.g. 04435-0K400",
    q3: "03 / QUANTITY",
    unit: "UNIT",
    unitPlaceholder: "units",
    q4: "04 / DESTINATION",
    q5: "05 / WHEN DO YOU NEED IT?",
    q6: "06 / ATTACHMENT (OPTIONAL)",
    uploading: "Uploading…",
    attached: "Attached:",
    q7: "07 / YOUR DETAILS",
    yourName: "YOUR NAME",
    company: "COMPANY",
    email: "EMAIL",
    phone: "PHONE",
    anythingElse: "ANYTHING ELSE?",
    summaryTitle: "YOUR REQUIREMENT",
    product: "Product",
    partNumber: "Part Number",
    quantity: "Quantity",
    destination: "Destination",
    timeline: "Timeline",
    contact: "Contact",
    noPartNumber: (brand: string) => `${brand} (no part number)`,
    dash: "—",
    summaryNote: "You can complete technical details on the next step.",
    turnstileDisabled: "Turnstile disabled locally.",
    back: "← BACK",
    next: "NEXT →",
    submitting: "SUBMITTING…",
    submit: "SUBMIT REQUEST",
  },
  fa: {
    eyebrow: "۱۰ / تنظیم درخواست",
    headline: "درخواست خود را بسازید.",
    body: "با آنچه می‌دانید شروع کنید. تیم رناس در تکمیل باقی جزئیات کمک می‌کند.",
    destinations: ["ایران", "اقلیم کردستان", "عراق", "سایر"],
    timelines: ["فوری", "طی ۳۰ روز آینده", "خرید برنامه‌ریزی‌شده", "مطمئن نیستم"],
    productRequired: "پیش از ادامه، بگویید به چه چیزی نیاز دارید.",
    uploadFailed: "آپلود این فایل ممکن نشد. تصویر کوچک‌تر یا فایل PDF را امتحان کنید.",
    genericError: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
    networkError: "امکان اتصال به سرور نبود. اتصال اینترنت خود را بررسی و دوباره تلاش کنید.",
    success: "درخواست شما دریافت شد. تیم ما به‌زودی پیگیری خواهد کرد.",
    q1: "۰۱ / به چه چیزی نیاز دارید؟",
    productPlaceholder: "دیسک ترمز",
    q2brand: "۰۲ / برند",
    q2part: "شماره فنی قطعه",
    partPlaceholder: "مثلاً 04435-0K400",
    q3: "۰۳ / تعداد",
    unit: "واحد",
    unitPlaceholder: "عدد",
    q4: "۰۴ / مقصد",
    q5: "۰۵ / چه زمانی نیاز دارید؟",
    q6: "۰۶ / پیوست (اختیاری)",
    uploading: "در حال آپلود…",
    attached: "پیوست شد:",
    q7: "۰۷ / اطلاعات شما",
    yourName: "نام شما",
    company: "شرکت",
    email: "ایمیل",
    phone: "تلفن",
    anythingElse: "نکته‌ی دیگری هست؟",
    summaryTitle: "خلاصه‌ی درخواست شما",
    product: "محصول",
    partNumber: "شماره فنی",
    quantity: "تعداد",
    destination: "مقصد",
    timeline: "بازه‌ی زمانی",
    contact: "تماس",
    noPartNumber: (brand: string) => `${brand} (بدون شماره فنی)`,
    dash: "—",
    summaryNote: "جزئیات فنی را می‌توانید در مرحله‌ی بعد تکمیل کنید.",
    turnstileDisabled: "Turnstile به‌صورت محلی غیرفعال است.",
    back: "→ قبلی",
    next: "بعدی ←",
    submitting: "در حال ارسال…",
    submit: "ثبت درخواست",
  },
};

interface RequestSupplyFormProps {
  locale?: Locale;
  /** Optional CMS copy for the section header — falls back to defaults so
   * this still works standalone on /request-supply, which doesn't render it
   * through the section registry. */
  eyebrow?: string;
  headline?: string;
  body?: string;
}

export function RequestSupplyForm({ locale = "en", eyebrow, headline, body }: RequestSupplyFormProps = {}) {
  const t = COPY[locale];
  const [values, setValues] = useState({
    productName: "",
    brand: "",
    partNumber: "",
    quantity: "",
    unit: "",
    destination: "",
    // Not a backend field — folded into `message` on submit, since the RFQ
    // schema has no dedicated urgency field and `contactChannel` means
    // "preferred contact method," not "when do you need it."
    timeline: "",
    contactName: "",
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    message: "",
  });
  const [stepIndex, setStepIndex] = useState(0);
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

  const step: Step = STEPS[stepIndex];

  function set<K extends keyof typeof values>(key: K, value: string) {
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent("rfq_started");
    }
    setValues((v) => ({ ...v, [key]: value }));
  }

  function goNext() {
    if (step === "product" && !values.productName.trim()) {
      setErrors({ productName: t.productRequired });
      return;
    }
    setErrors({});
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1));
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
      setErrors((prev) => ({ ...prev, attachment: t.uploadFailed }));
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

    const message = values.timeline
      ? `Timeline: ${values.timeline}${values.message ? `\n\n${values.message}` : ""}`
      : values.message;

    try {
      const res = await fetch(`${config.apiUrl}/api/v1/public/supply-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: values.productName,
          brand: values.brand,
          partNumber: values.partNumber,
          quantity: values.quantity,
          unit: values.unit,
          destination: values.destination,
          contactName: values.contactName,
          companyName: values.companyName,
          contactEmail: values.contactEmail,
          contactPhone: values.contactPhone,
          message,
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
        setErrorMessage(body?.error?.message ?? t.genericError);
        setStatus("error");
        return; // form values are preserved — never cleared on failure
      }

      trackEvent("rfq_submitted");
      setStatus("success");
    } catch {
      setErrorMessage(t.networkError);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <section className="m-composer section--teal" id="composer" aria-label="Build your requirement" data-theme-bg="teal">
        <div className="container" style={{ paddingBlock: "var(--sp-9)" }}>
          <div className="m-form-banner m-form-banner--success">{t.success}</div>
        </div>
      </section>
    );
  }

  const atSummary = step === "summary";

  return (
    <section className="m-composer section--teal" id="composer" aria-label="Build your requirement" data-theme-bg="teal">
      <div className="container">
        <p className="eyebrow" style={{ color: "var(--cream)" }}>
          {eyebrow ?? t.eyebrow}
        </p>
        <h2 className="m-composer__headline headline">{headline ?? t.headline}</h2>
        <p className="body-lg">{body ?? t.body}</p>

        <form
          className="m-composer__panel"
          onSubmit={(e) => {
            if (!atSummary) {
              e.preventDefault();
              goNext();
              return;
            }
            handleSubmit(e);
          }}
          noValidate
        >
          {status === "error" && <div className="m-form-banner m-form-banner--error">{errorMessage}</div>}

          <div className="m-composer__steps" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span key={s} className={i === stepIndex ? "is-active" : i < stepIndex ? "is-done" : undefined}>
                {String(i + 1).padStart(2, "0")}
              </span>
            ))}
          </div>

          <div className={`m-composer__step${step === "product" ? " is-active" : ""}`}>
            <p className="m-composer__q">{t.q1}</p>
            <input
              className="m-composer__input"
              placeholder={t.productPlaceholder}
              value={values.productName}
              onChange={(e) => set("productName", e.target.value)}
              aria-invalid={Boolean(errors.productName)}
              aria-describedby={errors.productName ? "err-productName" : undefined}
            />
            {errors.productName && (
              <p className="m-field-error" id="err-productName">
                {errors.productName}
              </p>
            )}
          </div>

          <div className={`m-composer__step${step === "part" ? " is-active" : ""}`}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-5)" }}>
              <div>
                <p className="m-composer__q">{t.q2brand}</p>
                <input className="m-composer__input" value={values.brand} onChange={(e) => set("brand", e.target.value)} />
              </div>
              <div>
                <p className="m-composer__q">{t.q2part}</p>
                <input className="m-composer__input" placeholder={t.partPlaceholder} value={values.partNumber} onChange={(e) => set("partNumber", e.target.value)} />
              </div>
            </div>
          </div>

          <div className={`m-composer__step${step === "quantity" ? " is-active" : ""}`}>
            <div className="m-composer__qty">
              <div>
                <p className="m-composer__q">{t.q3}</p>
                <input
                  className="m-composer__input m-composer__input--qty"
                  value={values.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <p className="m-composer__q">{t.unit}</p>
                <input
                  className="m-composer__input m-composer__input--unit"
                  placeholder={t.unitPlaceholder}
                  value={values.unit}
                  onChange={(e) => set("unit", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={`m-composer__step${step === "destination" ? " is-active" : ""}`}>
            <p className="m-composer__q">{t.q4}</p>
            <div className="m-composer__choices">
              {t.destinations.map((d) => (
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

          <div className={`m-composer__step${step === "timeline" ? " is-active" : ""}`}>
            <p className="m-composer__q">{t.q5}</p>
            <div className="m-composer__choices">
              {t.timelines.map((time) => (
                <button
                  key={time}
                  type="button"
                  className={`m-choice${values.timeline === time ? " is-selected" : ""}`}
                  onClick={() => set("timeline", time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div className={`m-composer__step${step === "attachment" ? " is-active" : ""}`}>
            <p className="m-composer__q">{t.q6}</p>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleAttachment} disabled={attaching} />
            {attaching && <p className="meta">{t.uploading}</p>}
            {attachment && <p className="meta">{t.attached} {attachment.name}</p>}
            {errors.attachment && <p className="m-field-error">{errors.attachment}</p>}
          </div>

          <div className={`m-composer__step${step === "contact" ? " is-active" : ""}`}>
            <p className="m-composer__q">{t.q7}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-5)", marginBottom: "var(--sp-5)" }}>
              <div>
                <label className="meta">{t.yourName}</label>
                <input
                  className="m-composer__input"
                  value={values.contactName}
                  onChange={(e) => set("contactName", e.target.value)}
                  aria-invalid={Boolean(errors.contactName)}
                />
                {errors.contactName && <p className="m-field-error">{errors.contactName}</p>}
              </div>
              <div>
                <label className="meta">{t.company}</label>
                <input className="m-composer__input" value={values.companyName} onChange={(e) => set("companyName", e.target.value)} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-5)", marginBottom: "var(--sp-5)" }}>
              <div>
                <label className="meta">{t.email}</label>
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
                <label className="meta">{t.phone}</label>
                <input className="m-composer__input" value={values.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
              </div>
            </div>
            <label className="meta">{t.anythingElse}</label>
            <textarea
              className="m-composer__input"
              rows={3}
              value={values.message}
              onChange={(e) => set("message", e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className={`m-composer__step${atSummary ? " is-active" : ""}`}>
            <p className="m-composer__q">{t.summaryTitle}</p>
            <dl className="m-composer__summary">
              <div>
                <dt>{t.product}</dt>
                <dd>{values.productName || t.dash}</dd>
              </div>
              <div>
                <dt>{t.partNumber}</dt>
                <dd>{values.partNumber || (values.brand ? t.noPartNumber(values.brand) : t.dash)}</dd>
              </div>
              <div>
                <dt>{t.quantity}</dt>
                <dd>{values.quantity ? `${values.quantity} ${values.unit || t.unitPlaceholder}` : t.dash}</dd>
              </div>
              <div>
                <dt>{t.destination}</dt>
                <dd>{values.destination || t.dash}</dd>
              </div>
              <div>
                <dt>{t.timeline}</dt>
                <dd>{values.timeline || t.dash}</dd>
              </div>
              <div>
                <dt>{t.contact}</dt>
                <dd>{values.contactName || values.contactEmail || t.dash}</dd>
              </div>
            </dl>
            <p className="m-composer__note">{t.summaryNote}</p>
          </div>

          {/* Honeypot — real users never see or fill this in; bots that autofill every field will. */}
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px" }} aria-hidden="true" />

          {config.turnstileSiteKey ? (
            <div data-turnstile-sitekey={config.turnstileSiteKey} />
          ) : (
            process.env.NODE_ENV !== "production" && <p className="meta">{t.turnstileDisabled}</p>
          )}

          <div className="m-composer__nav">
            <button type="button" className="btn btn--ghost-light" onClick={goBack} style={{ visibility: stepIndex === 0 ? "hidden" : "visible" }}>
              {t.back}
            </button>
            {atSummary ? (
              <button type="submit" className="btn btn--primary" disabled={status === "submitting"}>
                {status === "submitting" ? t.submitting : t.submit} <span className="arrow">↗</span>
              </button>
            ) : (
              <button type="submit" className="btn btn--ghost-light">
                {t.next}
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
