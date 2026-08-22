"use client";

import { trackEvent } from "@/lib/analytics";

export function RequestSupplyCta({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <a href="/request-supply" className={className} onClick={() => trackEvent("request_supply_clicked")}>
      {children}
    </a>
  );
}
