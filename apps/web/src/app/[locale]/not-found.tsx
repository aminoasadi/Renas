"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const COPY = {
  en: {
    eyebrow: "404",
    headline: "Page not found.",
    body: "The page you’re looking for doesn’t exist or hasn’t been published yet.",
    cta: "BACK TO HOME",
  },
  fa: {
    eyebrow: "۴۰۴",
    headline: "صفحه پیدا نشد.",
    body: "صفحه‌ای که به دنبال آن هستید وجود ندارد یا هنوز منتشر نشده است.",
    cta: "بازگشت به خانه",
  },
};

export default function NotFound() {
  const pathname = usePathname() || "";
  const locale = pathname.startsWith("/fa") ? "fa" : "en";
  const t = COPY[locale];

  return (
    <section className="section section--charcoal" style={{ minHeight: "60vh", display: "flex", alignItems: "center" }}>
      <div className="container">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="headline" style={{ fontSize: "var(--fs-display)", margin: "var(--sp-4) 0 var(--sp-5)" }}>
          {t.headline}
        </h1>
        <p className="body-lg" style={{ marginBottom: "var(--sp-7)" }}>
          {t.body}
        </p>
        <Link href={`/${locale}`} className="btn btn--primary">
          {t.cta} <span className="arrow">↗</span>
        </Link>
      </div>
    </section>
  );
}
