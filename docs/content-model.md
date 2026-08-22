# Content Model

## Pages and sections

A `Page` (title, slug, locale, status) owns an ordered list of `PageSection` rows. Each section has a `type` from a closed set (the "section registry") and a `content` JSON blob whose shape is dictated by that type. This is deliberately NOT a page builder with arbitrary blocks — an editor picks from a known catalog of section types, and each type has its own admin editor form and its own frontend React component. See `~/.claude/skills/swiss-editorial-motion/references/sections.md` for the design rationale behind each section archetype, and `packages/shared/src/section-registry.ts` + `packages/validation/src/sections.ts` for the authoritative type/schema definitions both the API and both frontends import.

The 15 registered section types: `hero`, `rich_text`, `process`, `supply_categories`, `supply_system`, `component_index`, `decision_layer`, `route_stories`, `operational_signals`, `capability`, `principles`, `cta`, `image`, `image_text`, `faq`.

Adding a 16th type requires updating, in lockstep: the Prisma `PageSectionType` enum, `PAGE_SECTION_TYPES` in `@renas/shared`, a Zod schema in `@renas/validation`, a frontend renderer component, and an admin editor form. There is intentionally no path to render a section type the frontend doesn't recognize, or to inject markup outside this system.

## Draft vs. published

Every `Page` and `BlogPost` carries three independent representations of its content:

1. **Draft** — `PageSection` rows (for pages) or the `content` JSON field (for blog posts). This is what the CMS editor reads and writes at all times. It is never served to the public.
2. **Published snapshot** — `Page.publishedSnapshot` / `BlogPost.publishedSnapshot`, an immutable JSON blob written only by the publish action. This is the ONLY thing the public API (`/public/pages/:slug`, `/public/blog/:slug`) ever reads.
3. **Revision history** — `ContentRevision` rows, one per publish (or per restore), each holding a full snapshot plus the editor and timestamp. Independent of #2, so history survives even if a later publish overwrites the "current" snapshot.

Restoring a revision copies its snapshot back into the draft rows (#1) — it does not touch the published snapshot (#2) or delete any revision (#3). The restored content only goes live once the editor explicitly publishes again.

## Media

`MediaAsset` rows point at objects in S3-compatible storage (`storageKey` + `publicUrl`); the file bytes themselves never live in the application's own filesystem or container. Every section content shape that references an image stores a `MediaRef` (`{ id, url, alt, width, height }`) rather than a bare URL, so the admin can always trace which content references which asset before allowing a delete (`MediaService.checkReferences`).

## SEO

`SeoMetadata` is a single shared shape (`seoTitle`, `seoDescription`, `canonicalUrl`, `robotsIndex`, `robotsFollow`, `ogTitle`, `ogDescription`, `ogImageId`) with an optional 1:1 relation from both `Page` and `BlogPost`. `apps/web/src/lib/seo.ts` is the one place that turns this shape into Next.js `Metadata` objects and JSON-LD (`Organization`, `Article`, `BreadcrumbList`) — every page/post route calls into it rather than building metadata ad hoc.

## RFQ and Contact

`SupplyRequest` and `ContactSubmission` are plain, non-versioned records — there's no draft/publish concept for a form submission. `SupplyRequestNote` lets an admin attach internal, never-public commentary to a request without mutating the submission itself.
