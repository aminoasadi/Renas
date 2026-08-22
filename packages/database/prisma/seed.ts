import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@renasxgroup.com";

  const admin = await prisma.user.upsert({
    where: { email: seedAdminEmail },
    create: { email: seedAdminEmail, name: "RENAS Super Admin", role: "SUPER_ADMIN", status: "ACTIVE" },
    update: {},
  });
  console.log(`Seeded SUPER_ADMIN: ${admin.email}`);

  await prisma.siteSettings.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      companyName: "RENAS Group",
      defaultSeoTitle: "RENAS Group — Industrial Supply & Regional Trade",
      defaultSeoDescription:
        "RENAS connects industrial buyers with evaluated suppliers and manages sourcing, verification, regional trade execution and delivery.",
      contactEmail: "hello@renasxgroup.com",
      footerText: "Industrial Supply. Regional Knowledge. Controlled Execution.",
    },
    update: {},
  });
  console.log("Seeded site settings");

  const headerNav = await prisma.navigation.upsert({
    where: { key: "HEADER" },
    create: { key: "HEADER" },
    update: {},
  });
  const footerNav = await prisma.navigation.upsert({
    where: { key: "FOOTER" },
    create: { key: "FOOTER" },
    update: {},
  });

  await prisma.navigationItem.deleteMany({ where: { navigationId: headerNav.id } });
  await prisma.navigationItem.createMany({
    data: [
      { navigationId: headerNav.id, label: "What We Do", url: "/what-we-do", position: 0 },
      { navigationId: headerNav.id, label: "Supply Solutions", url: "/supply-solutions", position: 1 },
      { navigationId: headerNav.id, label: "How It Works", url: "/how-it-works", position: 2 },
      { navigationId: headerNav.id, label: "About", url: "/about", position: 3 },
      { navigationId: headerNav.id, label: "Blog", url: "/blog", position: 4 },
      { navigationId: headerNav.id, label: "Contact", url: "/contact", position: 5 },
    ],
  });

  await prisma.navigationItem.deleteMany({ where: { navigationId: footerNav.id } });
  await prisma.navigationItem.createMany({
    data: [
      { navigationId: footerNav.id, label: "Request Supply", url: "/request-supply", position: 0 },
      { navigationId: footerNav.id, label: "Privacy", url: "/privacy", position: 1 },
    ],
  });
  console.log("Seeded navigation");

  // --- Home page: draft with one hero section, unpublished on purpose so
  // the CMS acceptance test ("public shows old content until Publish is
  // pressed") has something real to demonstrate against.
  const home = await prisma.page.upsert({
    where: { slug_locale: { slug: "home", locale: "en" } },
    create: {
      slug: "home",
      locale: "en",
      title: "Home",
      status: "DRAFT",
    },
    update: {},
  });

  const existingHeroSection = await prisma.pageSection.findFirst({
    where: { pageId: home.id, type: "hero" },
  });
  if (!existingHeroSection) {
    await prisma.pageSection.create({
      data: {
        pageId: home.id,
        type: "hero",
        position: 0,
        content: {
          eyebrow: "RENAS / INDUSTRIAL SUPPLY",
          headlineLines: ["INDUSTRIAL", "SUPPLY", "IN MOTION."],
          supportingLine: "FROM REQUIREMENT TO REALITY.",
          intro:
            "RENAS structures the movement between industrial demand, verified supply and regional trade execution.",
          images: [],
          primaryCta: { label: "START A SUPPLY REQUEST", href: "/request-supply" },
          secondaryCta: { label: "ENTER THE SYSTEM", href: "#system" },
        },
      },
    });
  }
  console.log(`Seeded Home page (id: ${home.id}, status: DRAFT — publish it from the CMS to go live)`);

  // --- About page, published immediately with minimal content so the
  // public site and sitemap have at least one real published page out of
  // the box.
  const about = await prisma.page.upsert({
    where: { slug_locale: { slug: "about", locale: "en" } },
    create: { slug: "about", locale: "en", title: "About RENAS", status: "DRAFT" },
    update: {},
  });
  const aboutSnapshot = {
    title: "About RENAS",
    slug: "about",
    locale: "en",
    seo: null,
    sections: [
      {
        type: "rich_text",
        position: 0,
        content: { html: "<p>RENAS Group is an industrial supply and regional trade company.</p>" },
        isVisible: true,
      },
    ],
  };
  await prisma.page.update({
    where: { id: about.id },
    data: { status: "PUBLISHED", publishedAt: new Date(), publishedSnapshot: aboutSnapshot },
  });
  await prisma.pageSection.deleteMany({ where: { pageId: about.id } });
  await prisma.pageSection.create({
    data: {
      pageId: about.id,
      type: "rich_text",
      position: 0,
      content: aboutSnapshot.sections[0].content,
    },
  });
  console.log(`Seeded About page (id: ${about.id}, status: PUBLISHED)`);

  // --- Request Supply page (draft), matching the RFQ acceptance flow.
  await prisma.page.upsert({
    where: { slug_locale: { slug: "request-supply", locale: "en" } },
    create: { slug: "request-supply", locale: "en", title: "Request Supply", status: "DRAFT" },
    update: {},
  });
  console.log("Seeded Request Supply page (DRAFT)");

  // --- Sample unpublished blog post.
  const existingPost = await prisma.blogPost.findUnique({ where: { slug: "industrial-supply-intelligence" } });
  if (!existingPost) {
    await prisma.blogPost.create({
      data: {
        title: "What Industrial Supply Intelligence Actually Means",
        slug: "industrial-supply-intelligence",
        excerpt: "A precise requirement creates a better sourcing process — here's what that looks like in practice.",
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "A precise requirement creates a better sourcing process." }],
            },
          ],
        },
        status: "DRAFT",
      },
    });
  }
  console.log("Seeded sample blog post (DRAFT)");

  // --- Initial supply categories (blog taxonomy placeholder + categories used by future component index content).
  const categories = ["Filters", "Engine Systems", "Brake Systems", "Suspension", "Electrical", "Consumables"];
  for (const name of categories) {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    await prisma.blogCategory.upsert({ where: { slug }, create: { name, slug }, update: {} });
  }
  console.log("Seeded initial supply categories as blog categories");

  console.log("\nSeed complete.");
  console.log(`Log in to the CMS with: ${seedAdminEmail} (OTP will be sent via Mailpit at http://localhost:8025)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
