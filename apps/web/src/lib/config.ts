function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
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
