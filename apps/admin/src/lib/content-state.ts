import type { AdminPage, AdminBlogPost } from "./types";

/**
 * A published page/post has unpublished changes when its draft (Page row +
 * sections, or BlogPost.content) was touched more recently than the last
 * publish. See `PagesService.touchPage` on the API side for why the Page
 * row's own `updatedAt` reliably reflects section edits too.
 */
export function hasUnpublishedChanges(entity: Pick<AdminPage | AdminBlogPost, "status" | "updatedAt" | "publishedAt">): boolean {
  if (entity.status !== "PUBLISHED" || !entity.publishedAt) return false;
  return new Date(entity.updatedAt).getTime() > new Date(entity.publishedAt).getTime();
}
