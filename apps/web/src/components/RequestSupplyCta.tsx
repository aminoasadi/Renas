"use client";

import { trackEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

export function RequestSupplyCta({ className, children, locale = "en" }: { className: string; children: React.ReactNode; locale?: Locale }) {
  return (
    <a href={`/${locale}/request-supply`} className={className} onClick={() => trackEvent("request_supply_clicked")}>
      {children}
    </a>
  );
}
