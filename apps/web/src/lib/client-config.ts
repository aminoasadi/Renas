/**
 * Config safe to import from "use client" components. Next.js only inlines
 * `NEXT_PUBLIC_*` env vars into the browser bundle — anything else (like
 * the server-only `config` in `./config.ts`) resolves to `undefined` at
 * runtime in the browser, so client components must import THIS file, not
 * that one. RequestSupplyForm/ContactForm previously imported the
 * server-only config and would have thrown on first render in production.
 */
export const clientConfig = {
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
};
