/**
 * Cache-tag naming used for Next.js `revalidateTag`. The API computes these
 * same tags when it needs to tell the web app what just changed, so the
 * names must match exactly between the API's publish handlers and the web
 * app's `fetch(..., { next: { tags: [...] } })` calls.
 */
export const revalidationTags = {
  page: (slug: string) => `page:${slug}`,
  blogList: () => "blog:list",
  blogPost: (slug: string) => `blog:post:${slug}`,
  navigation: () => "navigation",
  siteSettings: () => "site-settings",
} as const;
