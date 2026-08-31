"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

const LABELS: Record<Locale, string> = { en: "EN", fa: "فا" };

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`;
  // Swap only the leading /en or /fa segment, keep the rest of the path —
  // e.g. /en/what-we-do while on the Persian toggle points to /fa/what-we-do.
  const otherLocale: Locale = locale === "en" ? "fa" : "en";
  const rest = pathname.replace(/^\/(en|fa)/, "") || "";
  const href = `/${otherLocale}${rest}`;

  return (
    <a href={href} className="m-locale-switch" lang={otherLocale} aria-label={otherLocale === "fa" ? "نمایش به فارسی" : "View in English"}>
      {LABELS[otherLocale]}
    </a>
  );
}
