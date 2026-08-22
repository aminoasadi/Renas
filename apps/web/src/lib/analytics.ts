"use client";

/**
 * A single narrow chokepoint for every analytics call in the app — no
 * component should call `gtag` or `window.clarity` directly. This is what
 * lets us guarantee two things in one place: services never initialize
 * without a configured ID, and RFQ/contact PERSONAL data never accidentally
 * ends up in an event payload (see the explicit strip below).
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

const PII_KEYS = new Set([
  "email", "contactEmail", "phone", "contactPhone", "name", "contactName",
  "message", "companyName", "attachment", "attachmentMediaId",
]);

function stripPii(properties?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!properties) return undefined;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!PII_KEYS.has(key)) clean[key] = value;
  }
  return clean;
}

export type AnalyticsEvent =
  | "request_supply_clicked"
  | "rfq_started"
  | "rfq_submitted"
  | "contact_submitted"
  | "blog_post_viewed"
  | "whatsapp_clicked";

export function trackEvent(name: AnalyticsEvent, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const safeProperties = stripPii(properties);

  if (window.gtag) {
    window.gtag("event", name, safeProperties ?? {});
  }
  if (window.clarity) {
    window.clarity("event", name);
  }
}
