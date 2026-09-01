// `next build` evaluates every route module (robots.txt, sitemap.xml, page
// metadata) to collect static page data, which imports this file even for
// routes that don't run at request time until the container is actually
// deployed with real env vars. Docker/CI builds often don't have secrets
// wired up as build args, so fail hard only outside the build phase —
// during the build itself, fall back to a placeholder so `next build` can
// finish; the real values still need to be set on the running container.
function required(name: string): string {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NEXT_PHASE === "phase-production-build") return `__missing_${name}__`;
  throw new Error(`Missing required environment variable: ${name}`);
}

export const config = {
  apiUrl: required("API_URL"),
  webUrl: required("WEB_URL"),
  previewSecret: required("PREVIEW_SECRET"),
  revalidateSecret: required("REVALIDATE_SECRET"),
  gaId: process.env.NEXT_PUBLIC_GA_ID ?? "",
  clarityId: process.env.NEXT_PUBLIC_CLARITY_ID ?? "",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
};
