"use client";

import { trackEvent } from "@/lib/analytics";

export function WhatsAppLink({ number }: { number: string }) {
  const digits = number.replace(/[^\d]/g, "");
  return (
    <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("whatsapp_clicked")}>
      {number}
    </a>
  );
}
