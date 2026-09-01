# CMS Guide

## Logging in

There is no self-registration. A SUPER_ADMIN creates every account (`Users` in the admin, or the seed script for the first account) with a username and password. To log in:

1. Enter your username and password at `admin.renasxgroup.com/login`.
2. On success, a secure session cookie is set and you land on the dashboard.

A SUPER_ADMIN can reset any user's password from the `Users` page — this also revokes that user's active sessions. There is no email-based account recovery.

## Editing and publishing a page

1. **Pages → [a page] → open the editor.** You'll see the page's current status (`DRAFT` / `PUBLISHED` / `ARCHIVED`, plus `UNPUBLISHED CHANGES` if a published page's draft differs from what's live) and its section list.
2. **Add/edit/reorder/duplicate/hide sections.** Reordering uses drag-and-drop (dnd-kit). Each section type has its own form — see `docs/content-model.md` for the registry. Editing a section only changes the draft; nothing public changes yet.
3. **Save Draft** persists your changes. It never publishes.
4. **Preview Draft** opens the real public site in Next.js Draft Mode via a signed, short-lived token — you're looking at the actual frontend rendering your actual draft content, not a CMS-only mockup.
5. **Publish Changes** shows a confirmation (current status, last published time, draft's last-modified time) before committing. Confirming writes an immutable published snapshot, records a new `ContentRevision`, and tells the public site to invalidate its cache for that page. The change is live within moments — no rebuild, no redeploy.
6. **Revisions** lists every past publish with its editor and timestamp. **Restore as Draft** copies an old revision back into the draft (not directly to production) — you still need to Publish again to make it live.

## Blog

Posts follow the identical draft → preview → publish → revision pattern as pages, plus:

- **Scheduling** — set `scheduledAt` in the future and leave the post as a draft; a backend cron job (`BlogSchedulerService`, runs every minute) publishes it automatically once that time passes. This is idempotent: a post is only ever picked up while its status is still `DRAFT`.
- **Editor** — TipTap, storing structured JSON (not raw HTML) so the frontend can render it safely (see `docs/security.md`).
- **Taxonomy** — categories, tags, and authors are managed inline from the blog admin, not a separate application.

## Media library

Upload, browse, search, and edit alt text/caption from **Media**. Selecting an image from the library (rather than re-uploading) is how every section editor and the blog editor attach images. Before deleting an asset, the admin checks known references (SEO images, blog covers, author avatars, site settings, RFQ attachments) and blocks or warns accordingly — see `MediaService.checkReferences`. Section content stored as free-form JSON can't be indexed by a database query, so the UI additionally reminds the editor to check page content manually.

## Navigation and Settings

**Navigation** manages the Header and Footer link lists (add/edit/reorder/hide/delete, internal or external). **Settings** covers company name, contact details, logo/favicon/default OG image (via the media library), and default SEO fallbacks. Both call the API's `revalidateTag("navigation")` / `revalidateTag("site-settings")` on save, so changes appear on the public site immediately.

## Supply Requests (RFQ) and Contact Submissions

Both are read/manage-only lists in the admin — there's nothing to "publish." Filter by status, search, open a submission to see every field the visitor submitted (including UTM/referrer metadata), change its status, and (for RFQs) add internal notes that are never exposed publicly.

## Users and Audit Log

SUPER_ADMIN only. **Users**: create an authorized account (email + name + role), disable/enable, and disabling immediately revokes that user's active sessions. **Audit Log**: a read-only, filterable feed of every significant CMS action (who, what, when, from which IP) — see `packages/shared/src/audit.ts` for the full action list.
