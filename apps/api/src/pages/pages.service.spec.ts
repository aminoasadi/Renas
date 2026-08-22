import { NotFoundException } from "@nestjs/common";
import { PagesService } from "./pages.service";
import { RevisionsService } from "../content/revisions.service";
import { RevalidationService } from "../content/revalidation.service";
import { testPrisma, makeTestConfig, cleanupPage } from "../../test/test-helpers";

describe("PagesService (real Postgres — draft/publish/revision workflow)", () => {
  const config = makeTestConfig();
  const revisions = new RevisionsService(testPrisma as never);
  // Real RevalidationService, pointed at the configured WEB_URL — if the web
  // app isn't running during a unit-test run, this just logs a warning
  // (see RevalidationService) rather than failing the publish, which is
  // itself the correct documented behavior being exercised here.
  const revalidation = new RevalidationService(config);
  const pages = new PagesService(testPrisma as never, revisions, revalidation);

  let pageId: string;
  const slug = `test-page-${Date.now()}`;

  afterEach(async () => {
    if (pageId) await cleanupPage(pageId);
  });

  it("a new page starts in DRAFT with no published snapshot, and is not publicly retrievable", async () => {
    const page = await pages.create({ title: "Test Page", slug, locale: "en" });
    pageId = page.id;

    expect(page.status).toBe("DRAFT");
    expect(page.publishedSnapshot).toBeNull();

    await expect(pages.getPublishedBySlug(slug)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("editing draft sections never affects the published snapshot until Publish is called", async () => {
    const page = await pages.create({ title: "Test Page", slug, locale: "en" });
    pageId = page.id;

    await pages.addSection(pageId, {
      type: "rich_text",
      content: { html: "<p>original</p>" },
      isVisible: true,
    });

    await pages.publish(pageId, null as unknown as string);
    const publishedOriginal = await pages.getPublishedBySlug(slug);
    expect(JSON.stringify(publishedOriginal.sections)).toContain("original");

    // Edit the draft after publishing.
    const draft = await pages.getForEditing(pageId);
    await pages.updateSection(pageId, draft.sections[0].id, { content: { html: "<p>edited draft</p>" } });

    // Public/published content must still show the OLD content.
    const publishedStillOld = await pages.getPublishedBySlug(slug);
    expect(JSON.stringify(publishedStillOld.sections)).toContain("original");
    expect(JSON.stringify(publishedStillOld.sections)).not.toContain("edited draft");

    // But the draft (what preview would show) reflects the edit.
    const draftNow = await pages.getDraftBySlug(slug);
    expect(JSON.stringify(draftNow.sections)).toContain("edited draft");
  });

  it("publishing again updates the live snapshot and records a new revision version", async () => {
    const page = await pages.create({ title: "Test Page", slug, locale: "en" });
    pageId = page.id;
    await pages.addSection(pageId, { type: "rich_text", content: { html: "<p>v1</p>" }, isVisible: true });
    await pages.publish(pageId, null as unknown as string);

    const draft = await pages.getForEditing(pageId);
    await pages.updateSection(pageId, draft.sections[0].id, { content: { html: "<p>v2</p>" } });
    await pages.publish(pageId, null as unknown as string);

    const published = await pages.getPublishedBySlug(slug);
    expect(JSON.stringify(published.sections)).toContain("v2");

    const revisionList = await pages.listRevisions(pageId);
    expect(revisionList.map((r) => r.version).sort()).toEqual([1, 2]);
  });

  it("unpublishing hides content from the public API without deleting the underlying data", async () => {
    const page = await pages.create({ title: "Test Page", slug, locale: "en" });
    pageId = page.id;
    await pages.addSection(pageId, { type: "rich_text", content: { html: "<p>content</p>" }, isVisible: true });
    await pages.publish(pageId, null as unknown as string);

    await pages.unpublish(pageId);
    await expect(pages.getPublishedBySlug(slug)).rejects.toBeInstanceOf(NotFoundException);

    const stillEditable = await pages.getForEditing(pageId);
    expect(stillEditable.sections).toHaveLength(1);
  });

  it("restoring a revision overwrites the DRAFT only — publishing again is required to go live", async () => {
    const page = await pages.create({ title: "Test Page", slug, locale: "en" });
    pageId = page.id;
    await pages.addSection(pageId, { type: "rich_text", content: { html: "<p>v1</p>" }, isVisible: true });
    await pages.publish(pageId, null as unknown as string); // revision 1: v1

    const draft = await pages.getForEditing(pageId);
    await pages.updateSection(pageId, draft.sections[0].id, { content: { html: "<p>v2</p>" } });
    await pages.publish(pageId, null as unknown as string); // revision 2: v2

    await pages.restoreRevision(pageId, 1);

    const draftAfterRestore = await pages.getForEditing(pageId);
    expect(JSON.stringify(draftAfterRestore.sections)).toContain("v1");

    // Published content is still v2 — restore does not auto-publish.
    const publishedStillV2 = await pages.getPublishedBySlug(slug);
    expect(JSON.stringify(publishedStillV2.sections)).toContain("v2");
  });

  it("reordering sections persists the new position order", async () => {
    const page = await pages.create({ title: "Test Page", slug, locale: "en" });
    pageId = page.id;
    const a = await pages.addSection(pageId, { type: "rich_text", content: { html: "<p>A</p>" }, isVisible: true });
    const b = await pages.addSection(pageId, { type: "rich_text", content: { html: "<p>B</p>" }, isVisible: true });

    const reordered = await pages.reorderSections(pageId, [b.id, a.id]);
    expect(reordered[0].id).toBe(b.id);
    expect(reordered[1].id).toBe(a.id);
  });
});
