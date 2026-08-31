import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();
const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";

async function main() {
  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@renasxgroup.com";
  // Optional password login for the seeded admin, alongside the default OTP
  // flow — set ADMIN_USERNAME/ADMIN_PASSWORD in .env to enable it locally.
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const passwordHash = adminUsername && adminPassword ? await argon2.hash(adminPassword) : undefined;

  const admin = await prisma.user.upsert({
    where: { email: seedAdminEmail },
    create: {
      email: seedAdminEmail,
      name: "RENAS Super Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      username: adminUsername,
      passwordHash,
    },
    update: adminUsername ? { username: adminUsername, passwordHash } : {},
  });
  console.log(`Seeded SUPER_ADMIN: ${admin.email}${adminUsername ? ` (password login enabled for username "${adminUsername}")` : ""}`);

  await prisma.siteSettings.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      companyName: "RENAS Group",
      companyNameFa: "گروه رناس",
      defaultSeoTitle: "RENAS Group — Industrial Supply & Regional Trade",
      defaultSeoTitleFa: "گروه رناس — تأمین صنعتی و تجارت منطقه‌ای",
      defaultSeoDescription:
        "RENAS connects industrial buyers with evaluated suppliers and manages sourcing, verification, regional trade execution and delivery.",
      defaultSeoDescriptionFa:
        "رناس خریداران صنعتی را به تأمین‌کنندگان تأییدشده متصل می‌کند و فرآیند تأمین، تأیید، اجرای تجارت منطقه‌ای و تحویل را مدیریت می‌کند.",
      contactEmail: "hello@renasxgroup.com",
      footerText: "Industrial Supply. Regional Knowledge. Controlled Execution.",
      footerTextFa: "تأمین صنعتی. دانش منطقه‌ای. اجرای کنترل‌شده.",
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
      { navigationId: headerNav.id, locale: "en", label: "What We Do", url: "/what-we-do", position: 0 },
      { navigationId: headerNav.id, locale: "en", label: "Supply Solutions", url: "/supply-solutions", position: 1 },
      { navigationId: headerNav.id, locale: "en", label: "How It Works", url: "/how-it-works", position: 2 },
      { navigationId: headerNav.id, locale: "en", label: "About", url: "/about", position: 3 },
      { navigationId: headerNav.id, locale: "en", label: "Blog", url: "/blog", position: 4 },
      { navigationId: headerNav.id, locale: "en", label: "Contact", url: "/contact", position: 5 },
      { navigationId: headerNav.id, locale: "fa", label: "کار ما", url: "/what-we-do", position: 0 },
      { navigationId: headerNav.id, locale: "fa", label: "راهکارهای تأمین", url: "/supply-solutions", position: 1 },
      { navigationId: headerNav.id, locale: "fa", label: "روند کار", url: "/how-it-works", position: 2 },
      { navigationId: headerNav.id, locale: "fa", label: "درباره ما", url: "/about", position: 3 },
      { navigationId: headerNav.id, locale: "fa", label: "بلاگ", url: "/blog", position: 4 },
      { navigationId: headerNav.id, locale: "fa", label: "تماس با ما", url: "/contact", position: 5 },
    ],
  });

  await prisma.navigationItem.deleteMany({ where: { navigationId: footerNav.id } });
  await prisma.navigationItem.createMany({
    data: [
      { navigationId: footerNav.id, locale: "en", label: "Request Supply", url: "/request-supply", position: 0 },
      { navigationId: footerNav.id, locale: "en", label: "FAQ", url: "/faq", position: 1 },
      { navigationId: footerNav.id, locale: "en", label: "Privacy", url: "/privacy", position: 2 },
      { navigationId: footerNav.id, locale: "fa", label: "درخواست تأمین", url: "/request-supply", position: 0 },
      { navigationId: footerNav.id, locale: "fa", label: "سوالات متداول", url: "/faq", position: 1 },
      { navigationId: footerNav.id, locale: "fa", label: "حریم خصوصی", url: "/privacy", position: 2 },
    ],
  });

  // --- Site-wide FAQ list (admin-managed, /faq page) — drawn from the
  // same Q&A content already documented on the supply-solutions and
  // how-it-works pages, consolidated into one first-class, orderable list.
  // Seeded per-locale since FaqItem rows are locale-scoped.
  const faqItemsEn = [
    { question: "Do you supply OEM parts, aftermarket, or both?", answer: "Both. Where an OEM part is required we source it as specified; where a verified equivalent is acceptable we will present it alongside the OEM option with the trade-offs stated, so the choice stays yours." },
    { question: "Do you manufacture any of these parts yourselves?", answer: "No. RENAS sources from evaluated third-party suppliers and manages the trade and logistics process — we do not manufacture parts ourselves, and we do not present ourselves as doing so." },
    { question: "What if I only have a photo or a part off the vehicle?", answer: "That is a normal starting point. Send what you have and our team will work back to a sourceable specification — cross-referencing OEM numbers and equivalents before anything is quoted." },
    { question: "Do you handle repeat and scheduled supply?", answer: "Yes. Consumables and service-interval parts are usually better managed as ongoing replenishment against a known schedule rather than as repeated one-off requests." },
    { question: "My category isn't listed on the Supply Solutions page — is it out of scope?", answer: "Not necessarily. If it belongs on a heavy vehicle, submit the requirement and we will tell you honestly whether we can source it rather than accepting it and finding out later." },
    { question: "What do you need from me to start?", answer: "Whatever you already have — a part number, a photo, a vehicle model, or just a description of the failure. We work back from there rather than asking you to produce a specification before we will engage." },
    { question: "Is there a minimum order quantity?", answer: "MOQ varies by supplier and part rather than by category. We surface it during verification, so you see it before a commitment exists rather than after." },
    { question: "How do I know where my request has reached?", answer: "Each requirement moves through five stages — requirement, market & verification, commercial terms, route & logistics, delivery — and you are told which stage it is in and what is outstanding, including when the honest answer is that a supplier has not come back to us yet." },
    { question: "What happens if a part arrives wrong or damaged?", answer: "It stays our problem. Pre-shipment inspection exists to catch it earlier, but where something does go wrong we handle the supplier claim and the replacement rather than handing you a contact and stepping back." },
    { question: "Can you work with our existing freight forwarder?", answer: "Yes. Where you already have a forwarder or a customs broker you trust, we plan the documentation and routing around them instead of insisting on our own chain." },
  ];
  const faqItemsFa = [
    { question: "قطعات اورجینال (OEM)، بدل، یا هر دو را تأمین می‌کنید؟", answer: "هر دو. در مواردی که قطعه‌ی اورجینال لازم باشد، آن را طبق مشخصات تأمین می‌کنیم؛ در مواردی که معادل تأییدشده قابل‌قبول باشد، آن را در کنار گزینه‌ی اورجینال و همراه با توضیح تفاوت‌ها ارائه می‌دهیم تا انتخاب نهایی با شما باشد." },
    { question: "آیا خودتان این قطعات را تولید می‌کنید؟", answer: "خیر. رناس از تأمین‌کنندگان ثالث تأییدشده تأمین می‌کند و فرآیند تجارت و لجستیک را مدیریت می‌کند — ما خودمان قطعه تولید نمی‌کنیم و چنین ادعایی هم نداریم." },
    { question: "اگر فقط یک عکس یا قطعه‌ی جدا شده از خودرو داشته باشم چه؟", answer: "این یک نقطه‌ی شروع معمول است. آنچه دارید را ارسال کنید تا تیم ما با مرجع‌گیری از شماره‌های اورجینال و معادل‌ها، به یک مشخصه‌ی قابل‌تأمین برسد — پیش از هرگونه قیمت‌گذاری." },
    { question: "آیا تأمین تکراری و زمان‌بندی‌شده هم انجام می‌دهید؟", answer: "بله. قطعات مصرفی و قطعات با بازه‌ی سرویس دوره‌ای معمولاً بهتر است به‌صورت تأمین مستمر طبق یک برنامه‌ی مشخص مدیریت شوند تا درخواست‌های جداگانه‌ی مکرر." },
    { question: "دسته‌بندی من در صفحه‌ی راهکارهای تأمین نیست — یعنی خارج از توان شماست؟", answer: "لزوماً نه. اگر قطعه مربوط به یک خودروی سنگین است، درخواست را ثبت کنید تا صادقانه بگوییم امکان تأمین آن هست یا نه، به‌جای پذیرفتن درخواست و متوجه‌شدن بعدی." },
    { question: "برای شروع به چه چیزی از من نیاز دارید؟", answer: "هرچه که در حال حاضر دارید — شماره فنی، عکس، مدل خودرو، یا فقط توضیح خرابی. ما از همان‌جا شروع می‌کنیم، بدون اینکه از شما بخواهیم پیش از تعامل، مشخصات کامل ارائه دهید." },
    { question: "آیا حداقل تعداد سفارش دارید؟", answer: "حداقل سفارش بسته به تأمین‌کننده و قطعه متفاوت است، نه بر اساس دسته‌بندی. این موضوع را در مرحله‌ی تأیید مشخص می‌کنیم، یعنی پیش از ایجاد تعهد، نه بعد از آن." },
    { question: "چطور بفهمم درخواستم به کجا رسیده؟", answer: "هر درخواست پنج مرحله را طی می‌کند — نیازمندی، بازار و تأیید، شرایط تجاری، مسیر و لجستیک، تحویل — و به شما گفته می‌شود در کدام مرحله است و چه چیزی باقی مانده، حتی اگر پاسخ صادقانه این باشد که تأمین‌کننده هنوز پاسخ نداده است." },
    { question: "اگر قطعه اشتباه یا آسیب‌دیده برسد چه می‌شود؟", answer: "مسئولیت آن با ماست. بازرسی پیش از ارسال برای شناسایی زودتر مشکل وجود دارد، اما اگر مشکلی پیش بیاید، ما خودمان پیگیری ادعا از تأمین‌کننده و جایگزینی را انجام می‌دهیم، نه اینکه فقط یک مسیر تماس به شما بدهیم." },
    { question: "آیا با شرکت حمل‌ونقل فعلی ما هم همکاری می‌کنید؟", answer: "بله. اگر شرکت حمل‌ونقل یا کارگزار گمرکی مورد اعتماد خودتان را دارید، مستندسازی و مسیریابی را حول همان‌ها برنامه‌ریزی می‌کنیم، نه اینکه زنجیره‌ی خودمان را تحمیل کنیم." },
  ];
  await prisma.faqItem.deleteMany({});
  await prisma.faqItem.createMany({
    data: [
      ...faqItemsEn.map((item, index) => ({ ...item, locale: "en", position: index })),
      ...faqItemsFa.map((item, index) => ({ ...item, locale: "fa", position: index })),
    ],
  });
  console.log(`Seeded ${faqItemsEn.length + faqItemsFa.length} FAQ items (en + fa)`);
  console.log("Seeded navigation");

  // Home page content is seeded further below, once the `publishPage`/`img`
  // helpers exist — see "Home page" further down.

  // --- Publish a real page for every route the header/footer nav links to.
  // A nav item pointing at a page with no published content is exactly the
  // "empty page" gap this seed is closing.
  async function publishPage(
    slug: string,
    title: string,
    sections: Array<{ type: string; content: unknown }>,
    locale: "en" | "fa" = "en",
  ) {
    const page = await prisma.page.upsert({
      where: { slug_locale: { slug, locale } },
      create: { slug, locale, title, status: "DRAFT" },
      update: {},
    });
    const snapshot = {
      title,
      slug,
      locale,
      seo: null,
      sections: sections.map((s, i) => ({ ...s, position: i, isVisible: true })),
    };
    await prisma.page.update({
      where: { id: page.id },
      data: { status: "PUBLISHED", publishedAt: new Date(), publishedSnapshot: snapshot },
    });
    await prisma.pageSection.deleteMany({ where: { pageId: page.id } });
    await prisma.pageSection.createMany({
      data: snapshot.sections.map((s) => ({
        pageId: page.id,
        type: s.type as never,
        position: s.position,
        content: s.content as never,
      })),
    });
    console.log(`Seeded ${title} page [${locale}] (id: ${page.id}, status: PUBLISHED)`);
  }

  // `mediaRefSchema` requires a real UUID `id` and an absolute `url` — these
  // aren't real MediaAsset rows (no upload happened), just references to the
  // static images already shipped in apps/web/public, so the id is synthetic
  // and only needs to satisfy the schema's shape, not a foreign key.
  const img = (_debugLabel: string, file: string, alt: string) => ({ id: randomUUID(), url: `${WEB_URL}/images/home/${file}`, alt });
  const heroImg = (id: string, file: string, alt: string) => ({ media: img(id, file, alt) });

  await publishPage("home", "Home", [
    {
      type: "hero",
      content: {
        eyebrow: "RENAS / INDUSTRIAL SUPPLY · REGIONAL TRADE · 2026 / SYSTEM 01",
        headlineLines: ["INDUSTRIAL", "SUPPLY", "IN MOTION."],
        supportingLine: "FROM REQUIREMENT TO REALITY.",
        intro: "RENAS structures the movement between industrial demand, verified supply and regional trade execution.",
        images: [
          heroImg("home-hero-a", "00-macro-detail-of-an-early-diesel-engine-component-with-visibl.jpg", "Macro detail of an early diesel engine component with visible machining"),
          heroImg("home-hero-b", "01-stacked-shipping-containers-at-an-industrial-logistics-termi.jpg", "Stacked shipping containers at an industrial logistics terminal"),
          heroImg("home-hero-c", "02-high-altitude-road-running-through-regional-border-infrastru.jpg", "High-altitude road running through regional border infrastructure"),
        ],
        primaryCta: { label: "START A SUPPLY REQUEST", href: "#composer" },
        secondaryCta: { label: "ENTER THE SYSTEM", href: "#equation" },
      },
    },
    {
      type: "supply_equation",
      content: {
        eyebrow: "02 / THE SUPPLY EQUATION",
        terms: [
          { term: "requirement", label: "REQUIREMENT", copy: "A sourcing process only works when the requirement is understood correctly." },
          { term: "market", label: "MARKET", copy: "A quotation means little without understanding the market around it." },
          { term: "verification", label: "VERIFICATION", copy: "Supplier capability must be assessed before commercial commitment." },
          { term: "execution", label: "EXECUTION", copy: "Trade only becomes real when goods, documents and logistics move together." },
          { term: "delivery", label: "DELIVERY", copy: "The outcome is not a supplier introduction. The outcome is delivered supply.", isResult: true },
        ],
        footNote: "RENAS operates across the entire equation.",
      },
    },
    {
      type: "supply_system",
      content: {
        eyebrow: "03 / WHAT WE HANDLE",
        headline: "RENAS handles your",
        centerLabel: "RENAS",
        centerSubLabel: "ONE SCOPE, END TO END.",
        // x/y/connects are unused by this section's current rendering (a
        // scroll-cycled word in a fixed sentence, not a node diagram) but
        // stay populated because the schema still requires them — a future
        // admin edit or a different section instance may still want them.
        nodes: [
          { key: "requirement", label: "requirement", x: 8, y: 18, connects: ["product"], description: "A requirement is only actionable once it is translated into a specific, sourceable product." },
          { key: "product", label: "product", x: 30, y: 8, connects: ["requirement", "supplier"], description: "The product must match both the technical requirement and what suppliers can actually provide." },
          { key: "supplier", label: "supplier", x: 52, y: 14, connects: ["product", "market"], description: "A supplier is evaluated within the context of capability, product alignment and commercial feasibility." },
          { key: "market", label: "market", x: 74, y: 6, connects: ["supplier", "commercial"], description: "Market conditions determine whether a quotation is competitive or simply available." },
          { key: "commercial", label: "commercial", x: 90, y: 26, connects: ["market"], description: "Commercial terms are only meaningful once documentation and logistics can support them." },
          { key: "route", label: "route", x: 38, y: 60, connects: ["commercial", "logistic"], description: "The viable sourcing option is not always the cheapest quotation. The route must work too." },
          { key: "logistic", label: "logistic", x: 64, y: 56, connects: ["route", "delivery"], description: "Logistics translates a planned route into a physical movement of goods." },
          { key: "delivery", label: "delivery", x: 86, y: 70, connects: ["logistic"], description: "Delivery is the point where every prior decision either holds or fails." },
        ],
      },
    },
    {
      type: "component_index",
      content: {
        eyebrow: "COMPONENT INDEX / 01",
        headline: "Built around the parts that keep heavy vehicles moving.",
        items: [
          { number: "001", label: "FILTRATION", media: img("home-idx-filters", "03-product-photograph-of-a-heavy-duty-oil-filter.jpg", "Product photograph of a heavy-duty oil filter"), metaLines: ["APPLICATION / HEAVY VEHICLE", "STATUS / ACTIVE CAPABILITY"] },
          { number: "002", label: "ENGINE", media: img("home-idx-engine", "04-large-industrial-diesel-engine-assembly-in-a-heritage-store.jpg", "Large industrial diesel engine assembly in a heritage store"), metaLines: ["APPLICATION / HEAVY VEHICLE", "STATUS / ACTIVE CAPABILITY"] },
          { number: "003", label: "BRAKE", media: img("home-idx-brake", "05-detail-of-a-ventilated-brake-disc-rotor.jpg", "Detail of a ventilated brake disc rotor"), metaLines: ["APPLICATION / HEAVY VEHICLE", "STATUS / ACTIVE CAPABILITY"] },
          { number: "004", label: "SUSPENSION", media: img("home-idx-suspension", "06-heavy-vehicle-suspension-and-twin-tire-assembly.jpg", "Heavy vehicle suspension and twin-tire assembly"), metaLines: ["APPLICATION / HEAVY VEHICLE", "STATUS / ACTIVE CAPABILITY"] },
          { number: "005", label: "ELECTRICAL", media: img("home-idx-electrical", "07-industrial-electrical-components-and-circuitry.jpg", "Industrial electrical components and circuitry"), metaLines: ["APPLICATION / HEAVY VEHICLE", "STATUS / ACTIVE CAPABILITY"] },
          { number: "006", label: "CONSUMABLES", media: img("home-idx-consumables", "08-organized-technical-components-on-an-industrial-shelf.jpg", "Organized technical components on an industrial shelf"), metaLines: ["APPLICATION / HEAVY VEHICLE", "STATUS / ACTIVE CAPABILITY"] },
        ],
        cta: { label: "REQUEST A COMPONENT", href: "#composer" },
      },
    },
    {
      type: "decision_layer",
      content: {
        eyebrow: "05 / DECISION LAYER",
        headline: "The cheapest source is not always the right source.",
        supportingLine: "Every sourcing decision exists inside a larger operational context.",
        factors: [
          { index: "01", bigWord: "PRICE", title: "PRICE", body: "A quotation must be understood relative to market conditions and commercial terms." },
          { index: "02", bigWord: "FIT", title: "CAPABILITY", body: "The supplier must be able to meet the actual requirement." },
          { index: "03", bigWord: "FIT", title: "SPECIFICATION", body: "The right product means technical alignment, not simply a matching name." },
          { index: "04", bigWord: "ROUTE", title: "ROUTE", body: "A commercially attractive source has little value if the execution path does not work." },
          { index: "05", bigWord: "TIME", title: "TIMING", body: "Availability and delivery requirements change the sourcing decision." },
          { index: "06", bigWord: "RISK", title: "RISK", body: "Supplier, documentation and logistics risks must be considered together." },
          { index: "—", bigWord: "DECISION", title: "DECISION", body: "RENAS weighs price, fit, route, timing and risk together before recommending a source." },
        ],
      },
    },
    {
      type: "route_stories",
      content: {
        eyebrow: "06 / ROUTE STORIES",
        headline: "Supply is global. Execution is local.",
        supportingLine: "RENAS combines international sourcing with practical understanding of regional trade execution.",
        stories: [
          { label: "SOURCE / EAST ASIA", title: "CHINA → IRAN", body: "Global sourcing begins with access. Execution begins with understanding what happens after the supplier is found.", media: img("home-route-1", "09-export-container-terminal-with-gantry-cranes.jpg", "Export container terminal with gantry cranes") },
          { label: "TRADE HUB / GULF", title: "UAE → IRAN", body: "Regional hubs create sourcing flexibility, but commercial and logistical structures still determine feasibility.", media: img("home-route-2", "10-container-port-and-freight-yard-at-a-gulf-trade-hub.jpg", "Container port and freight yard at a Gulf trade hub") },
          { label: "OVERLAND / WEST", title: "TURKEY → IRAQ", body: "Overland routes introduce different constraints, lead times and operational dependencies.", media: img("home-route-3", "11-truck-convoy-on-an-overland-mountain-highway.jpg", "Truck convoy on an overland mountain highway") },
          { label: "REGIONAL EXECUTION", title: "IRAN → KURDISTAN REGION", body: "Regional knowledge becomes valuable where global sourcing meets local execution.", media: img("home-route-4", "12-high-altitude-mountain-road-through-regional-border-infrastr.jpg", "High-altitude mountain road through regional border infrastructure") },
          { label: "OVERLAND / WEST", title: "IRAQ → IRAN", body: "Cross-border overland movement depends on document alignment as much as physical transport.", media: img("home-route-5", "09-export-container-terminal-with-gantry-cranes.jpg", "Export container terminal with gantry cranes") },
          { label: "REGIONAL / KURDISTAN", title: "ERBIL → IRAN", body: "Proximity does not remove the need for a structured route — it changes which constraints matter most.", media: img("home-route-6", "10-container-port-and-freight-yard-at-a-gulf-trade-hub.jpg", "Container port and freight yard at a Gulf trade hub") },
          { label: "SOUTH ASIA", title: "PAKISTAN → IRAN", body: "Longer overland distances raise the importance of route sequencing and realistic lead times.", media: img("home-route-7", "11-truck-convoy-on-an-overland-mountain-highway.jpg", "Truck convoy on an overland mountain highway") },
          { label: "CAUCASUS", title: "AZERBAIJAN → IRAN", body: "Northern routes bring their own customs and documentation profile, distinct from Gulf or overland-west paths.", media: img("home-route-8", "12-high-altitude-mountain-road-through-regional-border-infrastr.jpg", "High-altitude mountain road through regional border infrastructure") },
          { label: "GULF / SOUTH", title: "OMAN → IRAN", body: "Maritime access from the south adds a route option where port and vessel scheduling become the binding constraint.", media: img("home-route-9", "09-export-container-terminal-with-gantry-cranes.jpg", "Export container terminal with gantry cranes") },
          { label: "OVERLAND / WEST", title: "TURKEY → IRAN", body: "A direct Turkey corridor sits alongside the existing Turkey–Iraq path as a separate, distinct route option.", media: img("home-route-10", "10-container-port-and-freight-yard-at-a-gulf-trade-hub.jpg", "Container port and freight yard at a Gulf trade hub") },
        ],
      },
    },
    {
      type: "operational_signals",
      content: {
        eyebrow: "07 / OPERATIONAL SIGNALS",
        headline: "What determines whether a supply path works?",
        centerLine: "RENAS reads the signals before committing to the route.",
        signals: [
          { key: "specification", label: "SPECIFICATION", description: "A named part is not the same as a technically matched part." },
          { key: "leadtime", label: "LEAD TIME", description: "Availability at origin is not the same as delivery at destination." },
          { key: "origin", label: "ORIGIN", description: "Where a product is made shapes cost, lead time and documentation." },
          { key: "moq", label: "MOQ", description: "Supplier requirements can significantly change sourcing feasibility." },
          { key: "documentation", label: "DOCUMENTATION", description: "Execution depends on having the right documentation at the right point in the journey." },
          { key: "capability", label: "SUPPLIER CAPABILITY", description: "Capability determines whether a supplier can deliver, not just quote." },
          { key: "payment", label: "PAYMENT TERMS", description: "Payment terms shape which suppliers and routes are workable." },
          { key: "customs", label: "CUSTOMS", description: "Customs requirements differ by route, product and destination." },
          { key: "transport", label: "TRANSPORT", description: "The transport mode changes cost, risk and timing together." },
          { key: "destination", label: "DESTINATION", description: "The destination sets the constraints the entire route must satisfy." },
          { key: "availability", label: "AVAILABILITY", description: "Stated availability must be verified before a commitment is made." },
          { key: "commercial", label: "COMMERCIAL TERMS", description: "Commercial terms only hold if the rest of the system can support them." },
        ],
      },
    },
    {
      type: "heavy_vehicle_focus",
      content: {
        headline: "Heavy vehicles do not stop because a part was difficult to source.",
        subheadline: "They stop because the right part did not arrive when it was needed.",
        body: "This is where a supply request begins.",
        media: img("home-heavy", "13-close-up-detail-of-a-heavy-diesel-engine-assembly.jpg", "Close-up detail of a heavy diesel engine assembly"),
        cta: { label: "SUBMIT A REQUIREMENT", href: "#composer" },
        overlayLabels: ["PART NO.", "OEM / AFTERMARKET", "QTY.", "DESTINATION", "REQUIRED BY"],
      },
    },
    {
      type: "principles",
      content: {
        eyebrow: "09 / THE RENAS PRINCIPLE",
        headline: "Clarity before commitment.",
        items: [
          { index: "01", title: "UNDERSTAND BEFORE SOURCING.", body: "A precise requirement creates a better sourcing process." },
          { index: "02", title: "VERIFY BEFORE COMMITTING.", body: "Commercial opportunity must be matched by supplier capability." },
          { index: "03", title: "PLAN BEFORE MOVING.", body: "Routes, documents and logistics must work as one system." },
          { index: "04", title: "FOLLOW THROUGH TO DELIVERY.", body: "The process does not end when a supplier is introduced." },
        ],
        closingLine: "That is the RENAS principle.",
      },
    },
    {
      type: "requirement_composer",
      content: {
        eyebrow: "10 / REQUIREMENT COMPOSER",
        headline: "Build your requirement.",
        body: "Start with what you know. The RENAS team can help clarify the rest.",
      },
    },
  ]);

  await publishPage("home", "خانه", [
    {
      type: "hero",
      content: {
        eyebrow: "رناس / تأمین صنعتی · تجارت منطقه‌ای · ۲۰۲۶ / سامانه ۰۱",
        headlineLines: ["تأمین صنعتی", "در حرکت"],
        supportingLine: "از نیازمندی تا واقعیت.",
        intro: "رناس حرکت میان تقاضای صنعتی، تأمین تأییدشده و اجرای تجارت منطقه‌ای را ساختاردهی می‌کند.",
        images: [
          heroImg("home-hero-a-fa", "00-macro-detail-of-an-early-diesel-engine-component-with-visibl.jpg", "جزئیات درشت‌نمای یک قطعه‌ی موتور دیزلی قدیمی با ماشین‌کاری قابل مشاهده"),
          heroImg("home-hero-b-fa", "01-stacked-shipping-containers-at-an-industrial-logistics-termi.jpg", "کانتینرهای انبار شده در یک ترمینال لجستیک صنعتی"),
          heroImg("home-hero-c-fa", "02-high-altitude-road-running-through-regional-border-infrastru.jpg", "جاده‌ای در ارتفاع بالا که از میان زیرساخت مرزی منطقه عبور می‌کند"),
        ],
        primaryCta: { label: "شروع درخواست تأمین", href: "#composer" },
        secondaryCta: { label: "ورود به سامانه", href: "#equation" },
      },
    },
    {
      type: "supply_equation",
      content: {
        eyebrow: "۰۲ / معادله‌ی تأمین",
        terms: [
          { term: "requirement", label: "نیازمندی", copy: "فرآیند تأمین تنها زمانی درست کار می‌کند که نیازمندی به‌درستی درک شده باشد." },
          { term: "market", label: "بازار", copy: "یک قیمت پیشنهادی بدون درک بازار اطراف آن معنای چندانی ندارد." },
          { term: "verification", label: "تأیید", copy: "توانایی تأمین‌کننده باید پیش از تعهد تجاری ارزیابی شود." },
          { term: "execution", label: "اجرا", copy: "تجارت تنها زمانی واقعی می‌شود که کالا، اسناد و لجستیک با هم حرکت کنند." },
          { term: "delivery", label: "تحویل", copy: "نتیجه، معرفی یک تأمین‌کننده نیست. نتیجه، تأمین تحویل‌شده است.", isResult: true },
        ],
        footNote: "رناس در سراسر این معادله فعالیت می‌کند.",
      },
    },
    {
      type: "supply_system",
      content: {
        eyebrow: "۰۳ / آنچه ما مدیریت می‌کنیم",
        headline: "رناس مدیریت می‌کند:",
        centerLabel: "رناس",
        centerSubLabel: "یک محدوده، از ابتدا تا انتها.",
        nodes: [
          { key: "requirement", label: "نیازمندی", x: 8, y: 18, connects: ["product"], description: "نیازمندی تنها زمانی قابل‌اجراست که به یک محصول مشخص و قابل‌تأمین ترجمه شده باشد." },
          { key: "product", label: "محصول", x: 30, y: 8, connects: ["requirement", "supplier"], description: "محصول باید هم با نیازمندی فنی و هم با آنچه تأمین‌کنندگان واقعاً می‌توانند ارائه دهند، همخوانی داشته باشد." },
          { key: "supplier", label: "تأمین‌کننده", x: 52, y: 14, connects: ["product", "market"], description: "تأمین‌کننده در بافتِ توانایی، همخوانی محصول و امکان‌پذیری تجاری ارزیابی می‌شود." },
          { key: "market", label: "بازار", x: 74, y: 6, connects: ["supplier", "commercial"], description: "شرایط بازار تعیین می‌کند که یک قیمت پیشنهادی رقابتی است یا فقط در دسترس." },
          { key: "commercial", label: "شرایط تجاری", x: 90, y: 26, connects: ["market"], description: "شرایط تجاری تنها زمانی معنا دارد که مستندسازی و لجستیک بتوانند از آن پشتیبانی کنند." },
          { key: "route", label: "مسیر", x: 38, y: 60, connects: ["commercial", "logistic"], description: "گزینه‌ی تأمین قابل‌اجرا همیشه ارزان‌ترین پیشنهاد نیست. مسیر هم باید کار کند." },
          { key: "logistic", label: "لجستیک", x: 64, y: 56, connects: ["route", "delivery"], description: "لجستیک، مسیر برنامه‌ریزی‌شده را به یک جابه‌جایی فیزیکی کالا تبدیل می‌کند." },
          { key: "delivery", label: "تحویل", x: 86, y: 70, connects: ["logistic"], description: "تحویل نقطه‌ای است که هر تصمیم پیشین، یا درست از آب درمی‌آید یا شکست می‌خورد." },
        ],
      },
    },
    {
      type: "component_index",
      content: {
        eyebrow: "فهرست قطعات / ۰۱",
        headline: "بر پایه‌ی قطعاتی که خودروهای سنگین را در حرکت نگه می‌دارند.",
        items: [
          { number: "۰۰۱", label: "فیلتراسیون", media: img("home-idx-filters-fa", "03-product-photograph-of-a-heavy-duty-oil-filter.jpg", "عکس محصول یک فیلتر روغن سنگین"), metaLines: ["کاربرد / خودرو سنگین", "وضعیت / توانمندی فعال"] },
          { number: "۰۰۲", label: "موتور", media: img("home-idx-engine-fa", "04-large-industrial-diesel-engine-assembly-in-a-heritage-store.jpg", "مجموعه‌ی بزرگ موتور دیزل صنعتی در یک انبار قدیمی"), metaLines: ["کاربرد / خودرو سنگین", "وضعیت / توانمندی فعال"] },
          { number: "۰۰۳", label: "ترمز", media: img("home-idx-brake-fa", "05-detail-of-a-ventilated-brake-disc-rotor.jpg", "جزئیات یک دیسک ترمز تهویه‌دار"), metaLines: ["کاربرد / خودرو سنگین", "وضعیت / توانمندی فعال"] },
          { number: "۰۰۴", label: "تعلیق", media: img("home-idx-suspension-fa", "06-heavy-vehicle-suspension-and-twin-tire-assembly.jpg", "سیستم تعلیق و مجموعه‌ی دوچرخ خودرو سنگین"), metaLines: ["کاربرد / خودرو سنگین", "وضعیت / توانمندی فعال"] },
          { number: "۰۰۵", label: "برق", media: img("home-idx-electrical-fa", "07-industrial-electrical-components-and-circuitry.jpg", "قطعات و مدارهای برقی صنعتی"), metaLines: ["کاربرد / خودرو سنگین", "وضعیت / توانمندی فعال"] },
          { number: "۰۰۶", label: "مصرفی", media: img("home-idx-consumables-fa", "08-organized-technical-components-on-an-industrial-shelf.jpg", "قطعات فنی مرتب‌شده روی قفسه‌ی صنعتی"), metaLines: ["کاربرد / خودرو سنگین", "وضعیت / توانمندی فعال"] },
        ],
        cta: { label: "درخواست یک قطعه", href: "#composer" },
      },
    },
    {
      type: "decision_layer",
      content: {
        eyebrow: "۰۵ / لایه‌ی تصمیم",
        headline: "ارزان‌ترین منبع همیشه منبع درست نیست.",
        supportingLine: "هر تصمیم تأمین در دل یک بافت عملیاتی بزرگ‌تر قرار دارد.",
        factors: [
          { index: "۰۱", bigWord: "قیمت", title: "قیمت", body: "یک پیشنهاد قیمت باید نسبت به شرایط بازار و شرایط تجاری سنجیده شود." },
          { index: "۰۲", bigWord: "تطابق", title: "توانایی", body: "تأمین‌کننده باید بتواند نیازمندی واقعی را برآورده کند." },
          { index: "۰۳", bigWord: "تطابق", title: "مشخصات فنی", body: "محصول درست یعنی همخوانی فنی، نه فقط یک نام مشابه." },
          { index: "۰۴", bigWord: "مسیر", title: "مسیر", body: "منبعی که از نظر تجاری جذاب است، اگر مسیر اجرا کار نکند، ارزش چندانی ندارد." },
          { index: "۰۵", bigWord: "زمان", title: "زمان‌بندی", body: "در دسترس بودن و الزامات تحویل، تصمیم تأمین را تغییر می‌دهد." },
          { index: "۰۶", bigWord: "ریسک", title: "ریسک", body: "ریسک‌های تأمین‌کننده، مستندسازی و لجستیک باید با هم دیده شوند." },
          { index: "—", bigWord: "تصمیم", title: "تصمیم", body: "رناس پیش از پیشنهاد یک منبع، قیمت، تطابق، مسیر، زمان‌بندی و ریسک را با هم می‌سنجد." },
        ],
      },
    },
    {
      type: "route_stories",
      content: {
        eyebrow: "۰۶ / روایت مسیرها",
        headline: "تأمین جهانی است. اجرا محلی است.",
        supportingLine: "رناس تأمین بین‌المللی را با شناخت عملی از اجرای تجارت منطقه‌ای ترکیب می‌کند.",
        stories: [
          { label: "مبدأ / شرق آسیا", title: "چین ← ایران", body: "تأمین جهانی با دسترسی آغاز می‌شود. اجرا با درک آنچه پس از یافتن تأمین‌کننده رخ می‌دهد، آغاز می‌شود.", media: img("home-route-1-fa", "09-export-container-terminal-with-gantry-cranes.jpg", "ترمینال کانتینری صادراتی با جرثقیل‌های دروازه‌ای") },
          { label: "مرکز تجاری / خلیج فارس", title: "امارات ← ایران", body: "مراکز منطقه‌ای انعطاف در تأمین ایجاد می‌کنند، اما ساختارهای تجاری و لجستیکی همچنان امکان‌پذیری را تعیین می‌کنند.", media: img("home-route-2-fa", "10-container-port-and-freight-yard-at-a-gulf-trade-hub.jpg", "بندر کانتینری و حیاط باربری در یک مرکز تجاری خلیج فارس") },
          { label: "زمینی / غرب", title: "ترکیه ← عراق", body: "مسیرهای زمینی محدودیت‌ها، زمان‌های انتظار و وابستگی‌های عملیاتی متفاوتی ایجاد می‌کنند.", media: img("home-route-3-fa", "11-truck-convoy-on-an-overland-mountain-highway.jpg", "کاروان کامیون در بزرگراه کوهستانی") },
          { label: "اجرای منطقه‌ای", title: "ایران ← اقلیم کردستان", body: "دانش منطقه‌ای دقیقاً جایی ارزشمند می‌شود که تأمین جهانی به اجرای محلی می‌رسد.", media: img("home-route-4-fa", "12-high-altitude-mountain-road-through-regional-border-infrastr.jpg", "جاده‌ی کوهستانی در ارتفاع بالا از میان زیرساخت مرزی منطقه") },
          { label: "زمینی / غرب", title: "عراق ← ایران", body: "جابه‌جایی زمینی مرزی به همان اندازه‌ی حمل فیزیکی، به همخوانی اسناد وابسته است.", media: img("home-route-5-fa", "09-export-container-terminal-with-gantry-cranes.jpg", "ترمینال کانتینری صادراتی با جرثقیل‌های دروازه‌ای") },
          { label: "منطقه‌ای / کردستان", title: "اربیل ← ایران", body: "نزدیکی، نیاز به یک مسیر ساختاریافته را از بین نمی‌برد — فقط تعیین می‌کند کدام محدودیت‌ها مهم‌تر هستند.", media: img("home-route-6-fa", "10-container-port-and-freight-yard-at-a-gulf-trade-hub.jpg", "بندر کانتینری و حیاط باربری در یک مرکز تجاری خلیج فارس") },
          { label: "جنوب آسیا", title: "پاکستان ← ایران", body: "فاصله‌های زمینی طولانی‌تر، اهمیت توالی مسیر و زمان‌های انتظار واقع‌بینانه را افزایش می‌دهد.", media: img("home-route-7-fa", "11-truck-convoy-on-an-overland-mountain-highway.jpg", "کاروان کامیون در بزرگراه کوهستانی") },
          { label: "قفقاز", title: "آذربایجان ← ایران", body: "مسیرهای شمالی، پروفایل گمرکی و مستنداتی خاص خود را دارند، متفاوت از مسیرهای خلیج فارس یا زمینی غرب.", media: img("home-route-8-fa", "12-high-altitude-mountain-road-through-regional-border-infrastr.jpg", "جاده‌ی کوهستانی در ارتفاع بالا از میان زیرساخت مرزی منطقه") },
          { label: "خلیج فارس / جنوب", title: "عمان ← ایران", body: "دسترسی دریایی از جنوب یک گزینه‌ی مسیر دیگر اضافه می‌کند، جایی که زمان‌بندی بندر و کشتی محدودیت اصلی می‌شود.", media: img("home-route-9-fa", "09-export-container-terminal-with-gantry-cranes.jpg", "ترمینال کانتینری صادراتی با جرثقیل‌های دروازه‌ای") },
          { label: "زمینی / غرب", title: "ترکیه ← ایران", body: "یک کریدور مستقیم ترکیه در کنار مسیر موجود ترکیه–عراق، به‌عنوان یک گزینه‌ی مسیر جداگانه و متمایز قرار دارد.", media: img("home-route-10-fa", "10-container-port-and-freight-yard-at-a-gulf-trade-hub.jpg", "بندر کانتینری و حیاط باربری در یک مرکز تجاری خلیج فارس") },
        ],
      },
    },
    {
      type: "operational_signals",
      content: {
        eyebrow: "۰۷ / سیگنال‌های عملیاتی",
        headline: "چه چیزی تعیین می‌کند یک مسیر تأمین کار می‌کند یا نه؟",
        centerLine: "رناس پیش از تعهد به یک مسیر، سیگنال‌ها را می‌خواند.",
        signals: [
          { key: "specification", label: "مشخصات فنی", description: "یک قطعه با نام مشخص، همان قطعه‌ی از نظر فنی منطبق نیست." },
          { key: "leadtime", label: "زمان تحویل", description: "در دسترس بودن در مبدأ، همان تحویل در مقصد نیست." },
          { key: "origin", label: "مبدأ", description: "محل تولید یک محصول، هزینه، زمان تحویل و مستندات را شکل می‌دهد." },
          { key: "moq", label: "حداقل سفارش", description: "الزامات تأمین‌کننده می‌تواند امکان‌پذیری تأمین را به‌طور قابل‌توجهی تغییر دهد." },
          { key: "documentation", label: "مستندسازی", description: "اجرا به داشتن مستندات درست در نقطه‌ی درست از مسیر وابسته است." },
          { key: "capability", label: "توانایی تأمین‌کننده", description: "توانایی تعیین می‌کند که آیا تأمین‌کننده می‌تواند تحویل دهد، نه فقط قیمت بدهد." },
          { key: "payment", label: "شرایط پرداخت", description: "شرایط پرداخت تعیین می‌کند کدام تأمین‌کنندگان و مسیرها قابل‌اجرا هستند." },
          { key: "customs", label: "گمرک", description: "الزامات گمرکی بسته به مسیر، محصول و مقصد متفاوت است." },
          { key: "transport", label: "حمل‌ونقل", description: "روش حمل، هزینه، ریسک و زمان‌بندی را با هم تغییر می‌دهد." },
          { key: "destination", label: "مقصد", description: "مقصد، محدودیت‌هایی را تعیین می‌کند که کل مسیر باید آن‌ها را برآورده کند." },
          { key: "availability", label: "در دسترس بودن", description: "در دسترس بودن اعلام‌شده باید پیش از هرگونه تعهد، تأیید شود." },
          { key: "commercial", label: "شرایط تجاری", description: "شرایط تجاری تنها زمانی پابرجاست که بقیه‌ی سامانه بتواند از آن پشتیبانی کند." },
        ],
      },
    },
    {
      type: "heavy_vehicle_focus",
      content: {
        headline: "خودروهای سنگین به این دلیل متوقف نمی‌شوند که تأمین یک قطعه سخت بود.",
        subheadline: "آن‌ها متوقف می‌شوند چون قطعه‌ی درست، زمانی که لازم بود، نرسید.",
        body: "اینجاست که یک درخواست تأمین آغاز می‌شود.",
        media: img("home-heavy-fa", "13-close-up-detail-of-a-heavy-diesel-engine-assembly.jpg", "جزئیات درشت‌نمای یک مجموعه‌ی موتور دیزل سنگین"),
        cta: { label: "ثبت یک نیازمندی", href: "#composer" },
        overlayLabels: ["شماره فنی", "اورجینال / بدل", "تعداد", "مقصد", "موعد نیاز"],
      },
    },
    {
      type: "principles",
      content: {
        eyebrow: "۰۹ / اصل رناس",
        headline: "شفافیت پیش از تعهد.",
        items: [
          { index: "۰۱", title: "پیش از تأمین، درک کن.", body: "یک نیازمندی دقیق، فرآیند تأمین بهتری می‌سازد." },
          { index: "۰۲", title: "پیش از تعهد، تأیید کن.", body: "فرصت تجاری باید با توانایی تأمین‌کننده همخوانی داشته باشد." },
          { index: "۰۳", title: "پیش از حرکت، برنامه‌ریزی کن.", body: "مسیر، اسناد و لجستیک باید به‌عنوان یک سامانه‌ی واحد کار کنند." },
          { index: "۰۴", title: "تا تحویل، پیگیری کن.", body: "فرآیند با معرفی یک تأمین‌کننده تمام نمی‌شود." },
        ],
        closingLine: "این اصل رناس است.",
      },
    },
    {
      type: "requirement_composer",
      content: {
        eyebrow: "۱۰ / تنظیم درخواست",
        headline: "درخواست خود را بسازید.",
        body: "با آنچه می‌دانید شروع کنید. تیم رناس در تکمیل باقی جزئیات کمک می‌کند.",
      },
    },
  ], "fa");

  await publishPage("about", "About RENAS", [
    {
      type: "page_masthead",
      content: {
        variant: "indexed",
        kicker: "ABOUT RENAS",
        headline: "Regional trade, made reliable.",
        standfirst:
          "RENAS Group is an industrial supply and regional trade company. We connect industrial buyers with evaluated suppliers and manage sourcing, verification, trade execution and delivery as one continuous system — built by people who have worked the region's supply routes directly, not just studied them from a desk.",
        intro:
          "This page sets out where RENAS came from, how the company actually operates day to day, and what we hold ourselves accountable for on every engagement — not marketing language, but the specific commitments a buyer can hold us to.",
        summaryPoints: [
          "Why RENAS exists, and the gap it was built to close",
          "How the sourcing and verification model actually works",
          "The regional execution knowledge behind our routing",
          "What we hold ourselves accountable for, in specific terms",
        ],
        meta: [
          { label: "SCOPE", value: "Industrial supply & regional trade" },
          { label: "EXECUTION MARKETS", value: "Iran · Kurdistan Region · Iraq" },
          { label: "SOURCING ORIGINS", value: "East Asia · Gulf · Turkey" },
        ],
        primaryCta: { label: "REQUEST SUPPLY", href: "/request-supply" },
        secondaryCta: { label: "HOW IT WORKS", href: "/how-it-works" },
      },
    },
    {
      type: "narrative_feature",
      content: {
        eyebrow: "WHY WE EXIST",
        headline: "The gap between where a part is made and where it is actually needed.",
        standfirst:
          "Most industrial supply failures in this region are not sourcing failures at all — they are coordination failures between people who each did their own job correctly.",
        blocks: [
          {
            kind: "paragraph",
            text: "A supplier in East Asia quotes a fair price for a genuinely correct part. A freight forwarder moves a container competently from one port to another. A customs broker files the paperwork they were handed. Each of these parties did their job. And the shipment still sits at the border for three weeks, because nobody owned the space between the jobs — nobody confirmed that the documentation the broker was handed actually matched the tariff treatment the route required, or that the supplier's stated lead time reflected a real production slot rather than a hopeful estimate.",
          },
          {
            kind: "subheading",
            text: "One accountable party, not a chain of introductions",
          },
          {
            kind: "paragraph",
            text: "RENAS was formed to own that space. Rather than acting as a single broker who hands off a supplier's contact details and calls the engagement complete, we operate as a control layer across the entire path a requirement takes: specification, supplier verification, commercial negotiation, documentation, routing, customs and final handover. A buyer deals with one accountable party for the whole path, not a sequence of vendors each responsible for their own narrow slice and nothing else.",
          },
          {
            kind: "pullquote",
            text: "The outcome of a sourcing engagement is not a supplier introduction. The outcome is a part that arrives, on the terms that were actually agreed.",
          },
          {
            kind: "subheading",
            text: "Built from inside the routes, not analysing them from outside",
          },
          {
            kind: "paragraph",
            text: "That distinction matters because most of what goes wrong in regional trade is invisible from a desk in a country that is not the destination. Which documentation a specific border post will actually accept this month, which suppliers hold real stock versus a production slot they are quoting hopefully, which routes carry a realistic transit time versus a theoretical one on a map — this is knowledge that comes from operating the routes, not from reading about them. RENAS's approach to sourcing and logistics is built on that operating knowledge, and it is why we are willing to tell a buyer a timeline is unrealistic rather than accept the requirement and explain the delay later.",
          },
        ],
      },
    },
    {
      type: "editorial_dossier",
      content: {
        eyebrow: "HOW WE OPERATE",
        headline: "The operating model, in four parts.",
        intro:
          "This is not a values poster. Each of the following is a specific commitment we hold ourselves to on every engagement, and each is something a buyer can verify against how we actually behave.",
        contentsLabel: "CONTENTS",
        chapters: [
          {
            id: "discipline",
            number: "01",
            title: "Requirements are evaluated before suppliers are contacted",
            body: [
              "Every requirement that reaches RENAS is first evaluated on its own technical merits — what is actually being asked for, what specification would satisfy it, and what a realistic sourcing path looks like — before a single supplier is contacted about it.",
              "This ordering matters because contacting suppliers first, then working backward to a specification that matches whatever they happen to offer, is how buyers end up with a part that technically clears customs but does not actually fit the application it was bought for.",
            ],
            keyPointsTitle: "WHAT THIS LOOKS LIKE IN PRACTICE",
            keyPoints: [
              "A stated need is translated into a sourceable specification before outreach begins",
              "OEM cross-references are checked against duty rating, not just dimensional fit",
              "A requirement we cannot specify precisely is flagged back to the buyer, not quietly guessed at",
            ],
          },
          {
            id: "transparency",
            number: "02",
            title: "Buyers see the real state of sourcing, not an optimistic summary",
            body: [
              "A supplier's stated lead time and a verified lead time are two different pieces of information, and buyers are entitled to know which one they are being given at any point in the process.",
              "We report the actual status of a requirement — including when a supplier has gone quiet, when a quoted price turned out to depend on a minimum order quantity nobody mentioned up front, or when a route's documentation requirement changed since the last shipment. An optimistic summary that turns out to be wrong costs more trust than an honest status update that says less than a buyer hoped to hear.",
            ],
            keyPointsTitle: "WHAT THIS MEANS FOR A BUYER",
            keyPoints: [
              "Status updates reflect verified information, not a supplier's own claims restated",
              "A realistic timeline is given once a requirement is actually understood — not on first contact",
              "Problems are surfaced as they are found, not batched into a single difficult conversation later",
            ],
          },
          {
            id: "regional-depth",
            number: "03",
            title: "Routing and documentation knowledge comes from operating the region",
            body: [
              "Iran, the Kurdistan Region and Iraq are not a single homogeneous destination for regional trade purposes — each carries its own documentation conventions, customs practice and practical constraints, and those constraints shift over time in ways that are not always reflected in published regulation.",
              "The routing and documentation decisions behind every RENAS engagement are made by people who have moved goods through these specific corridors, not by applying a generic international-trade template to a region it was not designed for.",
            ],
            keyPointsTitle: "WHERE THIS SHOWS UP",
            keyPoints: [
              "Route selection weighs current, not historical, border practice",
              "Documentation is prepared to the standard the specific destination actually enforces",
              "Consolidation and overland options are evaluated against real transit conditions, not distance alone",
            ],
          },
          {
            id: "accountability",
            number: "04",
            title: "One team is responsible from requirement to delivery",
            body: [
              "When something goes wrong on a shipment — a specification question, a documentation gap, a supplier that under-delivers on a promised inspection standard — the question of whose responsibility it is to fix should never be ambiguous to the buyer.",
              "Because RENAS carries the engagement end to end rather than handing off between disconnected vendors, that responsibility sits with us, in full, regardless of which specific stage the problem originated in. A buyer should never need to coordinate between three parties to resolve one problem.",
            ],
            keyPointsTitle: "IN PRACTICE",
            keyPoints: [
              "A single point of contact carries the requirement through every stage",
              "Supplier-side issues are resolved by RENAS, not redirected back to the buyer",
              "The engagement is not considered complete until the part has actually been delivered",
            ],
          },
        ],
      },
    },
    {
      type: "cta",
      content: {
        headline: "Have a requirement in mind?",
        body: "Start with what you know — our team can help clarify the rest.",
        primaryCta: { label: "REQUEST SUPPLY", href: "/request-supply" },
        secondaryCta: { label: "CONTACT US", href: "/contact" },
      },
    },
  ]);

  await publishPage("about", "درباره رناس", [
    {
      type: "page_masthead",
      content: {
        variant: "indexed",
        kicker: "درباره رناس",
        headline: "تجارت منطقه‌ای، قابل‌اعتماد.",
        standfirst:
          "گروه رناس یک شرکت تأمین صنعتی و تجارت منطقه‌ای است. ما خریداران صنعتی را به تأمین‌کنندگان تأییدشده متصل می‌کنیم و تأمین، تأیید، اجرای تجارت و تحویل را به‌عنوان یک سامانه‌ی پیوسته مدیریت می‌کنیم — ساخته‌شده توسط افرادی که مسیرهای تأمین منطقه را مستقیماً کار کرده‌اند، نه فقط از پشت میز مطالعه کرده‌اند.",
        intro:
          "این صفحه توضیح می‌دهد رناس از کجا آمده، شرکت روزانه چگونه واقعاً کار می‌کند، و در هر همکاری در برابر چه چیزی پاسخگو هستیم — نه زبان تبلیغاتی، بلکه تعهدات مشخصی که یک خریدار می‌تواند از ما بخواهد.",
        summaryPoints: [
          "چرا رناس وجود دارد و چه شکافی را ساخته شده تا پر کند",
          "مدل تأمین و تأیید واقعاً چگونه کار می‌کند",
          "دانش اجرای منطقه‌ای پشت مسیریابی ما",
          "در برابر چه چیزی، به‌طور مشخص، پاسخگو هستیم",
        ],
        meta: [
          { label: "محدوده فعالیت", value: "تأمین صنعتی و تجارت منطقه‌ای" },
          { label: "بازارهای اجرایی", value: "ایران · اقلیم کردستان · عراق" },
          { label: "مبادی تأمین", value: "شرق آسیا · خلیج فارس · ترکیه" },
        ],
        primaryCta: { label: "درخواست تأمین", href: "/request-supply" },
        secondaryCta: { label: "روند کار", href: "/how-it-works" },
      },
    },
    {
      type: "narrative_feature",
      content: {
        eyebrow: "چرا وجود داریم",
        headline: "شکاف میان جایی که یک قطعه ساخته می‌شود و جایی که واقعاً لازم است.",
        standfirst:
          "بیشتر شکست‌های تأمین صنعتی در این منطقه، اصلاً شکست تأمین نیستند — شکست هماهنگی میان افرادی هستند که هر کدام کار خودشان را درست انجام داده‌اند.",
        blocks: [
          {
            kind: "paragraph",
            text: "یک تأمین‌کننده در شرق آسیا قیمتی منصفانه برای یک قطعه‌ی واقعاً درست پیشنهاد می‌دهد. یک شرکت حمل‌ونقل به‌درستی یک کانتینر را از بندری به بندر دیگر جابه‌جا می‌کند. یک کارگزار گمرکی مدارکی را که به او سپرده شده ثبت می‌کند. هر یک از این طرف‌ها کار خودش را انجام داده است. و با این حال محموله سه هفته پشت مرز می‌ماند، چون هیچ‌کس مسئولیت فاصله‌ی میان این کارها را برعهده نگرفته بود — هیچ‌کس تأیید نکرد که مدارکی که به کارگزار سپرده شده واقعاً با نوع تعرفه‌ی مورد نیاز مسیر همخوانی دارد، یا اینکه زمان تحویل اعلام‌شده‌ی تأمین‌کننده، یک نوبت تولید واقعی است نه یک برآورد امیدوارانه.",
          },
          {
            kind: "subheading",
            text: "یک طرف پاسخگو، نه زنجیره‌ای از معرفی‌ها",
          },
          {
            kind: "paragraph",
            text: "رناس برای برعهده‌گرفتن همان فضا شکل گرفت. به‌جای عمل کردن به‌عنوان یک واسطه‌ی ساده که اطلاعات تماس یک تأمین‌کننده را رد و بدل می‌کند و همکاری را تمام‌شده می‌داند، ما به‌عنوان یک لایه‌ی کنترل در سراسر مسیری که یک نیازمندی طی می‌کند عمل می‌کنیم: مشخصات فنی، تأیید تأمین‌کننده، مذاکره‌ی تجاری، مستندسازی، مسیریابی، گمرک و تحویل نهایی. یک خریدار با یک طرف پاسخگو برای کل مسیر سروکار دارد، نه یک زنجیره از فروشندگانی که هر کدام فقط مسئول بخش محدود خودشان هستند و بس.",
          },
          {
            kind: "pullquote",
            text: "نتیجه‌ی یک همکاری تأمین، معرفی یک تأمین‌کننده نیست. نتیجه، قطعه‌ای است که با همان شرایطی که واقعاً توافق شده، می‌رسد.",
          },
          {
            kind: "subheading",
            text: "ساخته‌شده از درون مسیرها، نه تحلیل‌شده از بیرون",
          },
          {
            kind: "paragraph",
            text: "این تفاوت اهمیت دارد چون بیشتر چیزهایی که در تجارت منطقه‌ای اشتباه پیش می‌رود، از پشت میزی در کشوری که مقصد نیست، دیده نمی‌شود. اینکه یک گمرک مرزی مشخص این ماه واقعاً چه مدرکی را می‌پذیرد، کدام تأمین‌کنندگان موجودی واقعی دارند در برابر کسانی که فقط یک نوبت تولید را با امید قیمت می‌دهند، کدام مسیرها زمان ترانزیت واقع‌بینانه دارند در برابر زمانی که فقط روی نقشه نظری است — این دانشی است که از اجرای واقعی مسیرها می‌آید، نه از خواندن درباره‌ی آن‌ها. رویکرد رناس به تأمین و لجستیک بر پایه‌ی همین دانش عملیاتی ساخته شده، و به همین دلیل است که حاضریم به یک خریدار بگوییم یک زمان‌بندی غیرواقعی است، به‌جای پذیرفتن درخواست و توضیح تأخیر بعداً.",
          },
        ],
      },
    },
    {
      type: "editorial_dossier",
      content: {
        eyebrow: "ما چگونه کار می‌کنیم",
        headline: "مدل عملیاتی، در چهار بخش.",
        intro:
          "این یک پوستر ارزش‌ها نیست. هر یک از موارد زیر، تعهدی مشخص است که در هر همکاری به آن پایبندیم و هر خریداری می‌تواند آن را در برابر رفتار واقعی ما بسنجد.",
        contentsLabel: "فهرست",
        chapters: [
          {
            id: "discipline",
            number: "۰۱",
            title: "نیازمندی‌ها پیش از تماس با تأمین‌کنندگان ارزیابی می‌شوند",
            body: [
              "هر نیازمندی که به رناس می‌رسد، ابتدا بر پایه‌ی شایستگی‌های فنی خودش ارزیابی می‌شود — واقعاً چه چیزی درخواست شده، چه مشخصاتی آن را برآورده می‌کند، و یک مسیر تأمین واقع‌بینانه چه شکلی دارد — پیش از اینکه حتی یک تأمین‌کننده درباره‌ی آن تماس گرفته شود.",
              "این ترتیب اهمیت دارد چون تماس گرفتن با تأمین‌کنندگان ابتدا و سپس بازگشت به عقب برای رسیدن به مشخصاتی که با هرچه آن‌ها پیشنهاد می‌دهند همخوانی داشته باشد، دقیقاً همان راهی است که خریداران را به قطعه‌ای می‌رساند که از نظر فنی از گمرک عبور می‌کند اما واقعاً با کاربردی که برایش خریداری شده تطابق ندارد.",
            ],
            keyPointsTitle: "این در عمل چه شکلی دارد",
            keyPoints: [
              "یک نیاز اعلام‌شده، پیش از شروع تماس، به مشخصات قابل‌تأمین ترجمه می‌شود",
              "مرجع‌های متقابل اورجینال در برابر رتبه‌ی دوام بررسی می‌شوند، نه فقط تطابق ابعادی",
              "نیازمندی‌ای که نمی‌توانیم دقیق مشخص کنیم، به خریدار بازگردانده می‌شود، نه اینکه در سکوت حدس زده شود",
            ],
          },
          {
            id: "transparency",
            number: "۰۲",
            title: "خریداران وضعیت واقعی تأمین را می‌بینند، نه یک خلاصه‌ی خوش‌بینانه",
            body: [
              "زمان تحویل اعلام‌شده‌ی یک تأمین‌کننده و زمان تحویل تأییدشده، دو اطلاعات متفاوت هستند، و خریداران حق دارند بدانند در هر نقطه از فرآیند کدام‌یک به آن‌ها ارائه می‌شود.",
              "ما وضعیت واقعی یک نیازمندی را گزارش می‌دهیم — از جمله زمانی که یک تأمین‌کننده بی‌پاسخ مانده، زمانی که یک قیمت پیشنهادی معلوم شده به یک حداقل سفارش وابسته است که از ابتدا کسی نگفته بود، یا زمانی که الزام مستنداتی یک مسیر از آخرین محموله تغییر کرده است. یک خلاصه‌ی خوش‌بینانه که غلط از آب دربیاید، اعتماد بیشتری هزینه می‌کند تا یک به‌روزرسانی صادقانه که کمتر از آنچه خریدار امیدوار بود بگوید.",
            ],
            keyPointsTitle: "این برای یک خریدار چه معنایی دارد",
            keyPoints: [
              "به‌روزرسانی‌های وضعیت، اطلاعات تأییدشده را منعکس می‌کنند، نه بازگفتن ادعاهای خود تأمین‌کننده",
              "زمان‌بندی واقع‌بینانه زمانی داده می‌شود که نیازمندی واقعاً درک شده باشد — نه در اولین تماس",
              "مشکلات همان‌طور که پیدا می‌شوند مطرح می‌شوند، نه اینکه برای یک گفتگوی دشوار بعداً انباشته شوند",
            ],
          },
          {
            id: "regional-depth",
            number: "۰۳",
            title: "دانش مسیریابی و مستندسازی از اجرای واقعی در منطقه می‌آید",
            body: [
              "ایران، اقلیم کردستان و عراق از نظر تجارت منطقه‌ای یک مقصد یکسان نیستند — هر کدام قراردادهای مستنداتی، رویه‌ی گمرکی و محدودیت‌های عملی خودشان را دارند، و این محدودیت‌ها با گذر زمان تغییر می‌کنند، به شکلی که همیشه در مقررات منتشرشده منعکس نمی‌شود.",
              "تصمیمات مسیریابی و مستندسازی پشت هر همکاری رناس توسط افرادی گرفته می‌شود که کالا را از همین کریدورهای مشخص عبور داده‌اند، نه با اعمال یک الگوی عمومی تجارت بین‌المللی روی منطقه‌ای که برای آن طراحی نشده است.",
            ],
            keyPointsTitle: "این کجا خودش را نشان می‌دهد",
            keyPoints: [
              "انتخاب مسیر، رویه‌ی فعلی مرز را می‌سنجد، نه رویه‌ی تاریخی را",
              "مستندسازی طبق استانداردی آماده می‌شود که مقصد مشخص واقعاً اجرا می‌کند",
              "گزینه‌های تجمیعی و زمینی در برابر شرایط واقعی ترانزیت ارزیابی می‌شوند، نه فقط فاصله",
            ],
          },
          {
            id: "accountability",
            number: "۰۴",
            title: "یک تیم از نیازمندی تا تحویل مسئول است",
            body: [
              "وقتی مشکلی در یک محموله پیش می‌آید — یک پرسش مشخصاتی، یک خلأ مستنداتی، تأمین‌کننده‌ای که به استاندارد بازرسی وعده‌داده‌شده عمل نمی‌کند — سؤال اینکه مسئولیت رفع آن با کیست، هرگز نباید برای خریدار مبهم باشد.",
              "چون رناس همکاری را از ابتدا تا انتها با خود حمل می‌کند، نه با انتقال میان فروشندگان جدا از هم، آن مسئولیت به‌طور کامل با ماست، فارغ از اینکه مشکل در کدام مرحله‌ی مشخص آغاز شده. یک خریدار هرگز نباید برای حل یک مشکل، میان سه طرف هماهنگی کند.",
            ],
            keyPointsTitle: "در عمل",
            keyPoints: [
              "یک نقطه‌ی تماس واحد، نیازمندی را در تمام مراحل حمل می‌کند",
              "مشکلات سمت تأمین‌کننده توسط رناس حل می‌شود، نه اینکه به خریدار بازگردانده شود",
              "همکاری تا زمانی که قطعه واقعاً تحویل داده نشده، تمام‌شده در نظر گرفته نمی‌شود",
            ],
          },
        ],
      },
    },
    {
      type: "cta",
      content: {
        headline: "نیازمندی‌ای در ذهن دارید؟",
        body: "با آنچه می‌دانید شروع کنید — تیم ما در تکمیل باقی جزئیات کمک می‌کند.",
        primaryCta: { label: "درخواست تأمین", href: "/request-supply" },
        secondaryCta: { label: "تماس با ما", href: "/contact" },
      },
    },
  ], "fa");

  await publishPage("what-we-do", "What We Do", [
    {
      type: "page_masthead",
      content: {
        variant: "split",
        kicker: "WHAT WE DO",
        headline: "Industrial supply, managed as one scope.",
        standfirst:
          "RENAS connects industrial buyers with evaluated suppliers and manages sourcing, verification, regional trade execution and delivery — as one continuous system, not a series of handoffs between disconnected vendors.",
        intro:
          "Below is the full scope of what that means in practice: the ten functions we carry ourselves, the working vocabulary this work actually runs on, and — just as importantly — what falls outside our scope and why we are direct about that boundary.",
        summaryPoints: [
          "The ten functions RENAS carries as one accountable scope",
          "The real trade instruments this work runs on, explained",
          "What RENAS does not do, stated plainly",
        ],
        meta: [
          { label: "SCOPE OF WORK", value: "Specification through handover" },
          { label: "TYPICAL ENGAGEMENT", value: "Single requirement or ongoing supply" },
        ],
        primaryCta: { label: "REQUEST SUPPLY", href: "/request-supply" },
        secondaryCta: { label: "HOW IT WORKS", href: "/how-it-works" },
      },
    },
    {
      type: "editorial_dossier",
      content: {
        eyebrow: "SCOPE OF WORK",
        headline: "Ten functions, carried as one scope.",
        intro:
          "Each of the following is a real function RENAS performs on every engagement — not a marketing category. They are grouped below into the five stages a requirement actually passes through.",
        contentsLabel: "JUMP TO",
        chapters: [
          {
            id: "specification-sourcing",
            number: "01",
            title: "Specification & sourcing",
            body: [
              "Turning a stated need into a technically sourceable specification is the first thing we do, before any supplier is contacted. A part name or a photograph tells us what a buyer thinks they need; it rarely tells us, on its own, what will actually fit, perform and clear customs at the destination.",
              "Once a specification exists, suppliers are identified against that specification itself — not against the closest matching product name a search happens to surface. This is also where OEM cross-referencing happens: matching a part number to viable equivalents without silently dropping the duty rating or service life the original part carried.",
            ],
            keyPointsTitle: "WHAT THIS COVERS",
            keyPoints: ["Requirement-to-specification translation", "Supplier identification against the specification", "OEM cross-reference and equivalent evaluation"],
          },
          {
            id: "verification-negotiation",
            number: "02",
            title: "Verification & negotiation",
            body: [
              "Supplier capability and product alignment are assessed before a commitment exists, not after one has already failed. This means checking whether a supplier is quoting from real, on-hand stock or from a production slot that has not been confirmed, and whether their stated quality standard matches what the specification actually requires.",
              "Commercial terms are then negotiated in the context of the documentation and route that must support them — a favourable price attached to a route or a lead time that cannot actually be delivered is not a favourable price, it is a problem deferred to later in the engagement.",
            ],
            keyPointsTitle: "WHAT THIS COVERS",
            keyPoints: ["Supplier capability and stock-status verification", "Commercial term negotiation tied to a realistic route", "Payment structure appropriate to the trust level established"],
          },
          {
            id: "documentation-inspection",
            number: "03",
            title: "Documentation & inspection",
            body: [
              "Documents are prepared as part of the plan, not assembled reactively once goods are already moving. Tariff classification, certificates of origin and conformity requirements are worked out before the shipment leaves the supplier, because discovering a documentation gap at the border is the single most expensive point in the process to discover one.",
              "Pre-shipment inspection sits alongside documentation as a genuine check, not a formality: an independent confirmation that what was specified is actually what is being loaded, before it becomes much harder and more expensive to correct.",
            ],
            keyPointsTitle: "WHAT THIS COVERS",
            keyPoints: ["Tariff classification and certificate preparation", "Documentation matched to the specific destination's requirements", "Pre-shipment inspection against the original specification"],
          },
          {
            id: "routing-customs",
            number: "04",
            title: "Routing & customs",
            body: [
              "Route selection weighs cost against documentation burden and realistic transit time at the border — not distance on a map. Sea freight, overland transit through Turkey, or a consolidated mixed route each carry a different profile, and the cheapest option and the fastest option are rarely the same one.",
              "Customs clearance requirements differ by product, route and destination, and they shape the routing decision rather than following passively behind it. A route that looks efficient on paper but carries a heavier clearance burden than the documentation can support is not, in practice, the efficient option.",
            ],
            keyPointsTitle: "WHAT THIS COVERS",
            keyPoints: ["Route selection weighing cost, time and documentation together", "Customs clearance planning specific to the destination", "TIR carnet and consolidated-freight arrangements where applicable"],
          },
          {
            id: "freight-handover",
            number: "05",
            title: "Freight & handover",
            body: [
              "Transport mode changes cost, risk and timing together, so it is chosen as part of the same plan as documentation and routing — not bolted on afterward once a supplier has already shipped. The scope of the engagement does not end at a port or a border; it ends when the part is physically in the buyer's hands.",
              "That final handover is treated as a real stage of the engagement, with its own confirmation, rather than an assumed formality once the goods have cleared customs.",
            ],
            keyPointsTitle: "WHAT THIS COVERS",
            keyPoints: ["Transport mode selected alongside route and documentation", "Delivery tracked through to physical handover", "Confirmation the delivered part matches the original specification"],
          },
        ],
      },
    },
    // Proof by specificity: the instruments a buyer's own trade or logistics
    // team would recognise, instead of generic "trusted partner" claims.
    {
      type: "glossary",
      content: {
        eyebrow: "WORKING VOCABULARY",
        headline: "The instruments this work actually runs on.",
        intro:
          "If these terms are already familiar to your team, we are speaking the same language. If they are not, this is a reasonable starting point for understanding what a documented, verifiable supply engagement actually involves.",
        entries: [
          { term: "Incoterms 2020", definition: "The international rule set that defines exactly where risk and cost transfer between buyer, supplier and carrier — agreed before a shipment moves, not argued about after something goes wrong in transit." },
          { term: "HS Classification", definition: "The Harmonized System tariff code assigned to a product, which drives duty rate, clearance treatment and, on some routes, whether the product is admissible at all." },
          { term: "Proforma Invoice", definition: "The preliminary commercial document a buyer typically needs before internal funds or import approvals can be released on their side, ahead of the final commercial invoice." },
          { term: "Certificate of Origin", definition: "Formal evidence of where a product was manufactured, which determines duty treatment under applicable trade agreements and, on some routes, whether the product is admissible.", aka: ["CoO"] },
          { term: "Bill of Lading", definition: "The document that functions simultaneously as a receipt for goods, a contract of carriage and a document of title — an error here can stop a shipment at the port regardless of how correct everything else is.", aka: ["B/L"] },
          { term: "CMR Consignment Note", definition: "The standard international road-freight document governing overland cargo movement, relevant to shipments transiting through Turkey and Iraq by truck." },
          { term: "TIR Carnet", definition: "A customs document that allows sealed road freight to transit multiple international borders under a single guarantee, without a full customs inspection at each one." },
          { term: "Pre-Shipment Inspection", definition: "An independent, physical check confirming that the goods actually loaded match the goods specified — performed before departure, while a discrepancy is still cheap to correct.", aka: ["PSI"] },
          { term: "Letter of Credit", definition: "A payment mechanism where a bank guarantees payment to the supplier against the presentation of specified documents, used where the trust level between parties does not yet support open-account terms.", aka: ["LC"] },
          { term: "Packing List", definition: "The carton-level breakdown of a shipment's contents that both customs authorities and the receiving workshop depend on to verify what actually arrived." },
          { term: "OEM Cross-Reference", definition: "The process of matching an original equipment manufacturer part number to a viable equivalent, without silently dropping the duty rating, tolerance or service life the original part carried." },
          { term: "Warranty Terms", definition: "The specific commitment a supplier will actually stand behind once a part is in service — distinct from a general claim of quality, and worth confirming in writing before, not after, a failure." },
        ],
      },
    },
    {
      type: "narrative_feature",
      content: {
        eyebrow: "SCOPE BOUNDARY",
        headline: "What RENAS is not.",
        standfirst:
          "Being clear about the boundary of our scope is what makes the work inside it dependable.",
        blocks: [
          {
            kind: "paragraph",
            text: "RENAS is not a manufacturer. We do not produce the parts we source, and we do not present ourselves as though we do — every part moving through an engagement comes from a supplier we have evaluated, not from a factory we operate.",
          },
          {
            kind: "paragraph",
            text: "RENAS is also not a directory. We do not consider an engagement complete once a supplier's contact details have been handed over — verification, documentation, routing and delivery are carried through as part of the same accountable scope, by the same team, all the way to handover.",
          },
          {
            kind: "paragraph",
            text: "We do not quote a price we cannot document, and we do not confirm a lead time we have not checked against the actual route and supplier stock status. Where a requirement falls genuinely outside what we can responsibly deliver, we say so directly, rather than accepting the engagement and explaining the shortfall later.",
          },
        ],
      },
    },
    {
      type: "cta",
      content: {
        headline: "Have a requirement in mind?",
        body: "Start with what you know — our team can help clarify the rest.",
        primaryCta: { label: "REQUEST SUPPLY", href: "/request-supply" },
        secondaryCta: { label: "HOW IT WORKS", href: "/how-it-works" },
      },
    },
  ]);

  await publishPage("what-we-do", "کار ما", [
    {
      type: "page_masthead",
      content: {
        variant: "split",
        kicker: "کار ما",
        headline: "تأمین صنعتی، مدیریت‌شده به‌عنوان یک محدوده‌ی واحد.",
        standfirst:
          "رناس خریداران صنعتی را به تأمین‌کنندگان تأییدشده متصل می‌کند و تأمین، تأیید، اجرای تجارت منطقه‌ای و تحویل را مدیریت می‌کند — به‌عنوان یک سامانه‌ی پیوسته، نه یک زنجیره از انتقال میان فروشندگان جدا از هم.",
        intro:
          "در ادامه، محدوده‌ی کامل این کار در عمل آمده: ده کارکردی که خودمان انجام می‌دهیم، واژگان کاری که این حرفه واقعاً بر پایه‌ی آن می‌چرخد، و — به همان اندازه مهم — آنچه خارج از محدوده‌ی ماست و چرا درباره‌ی این مرز صریح هستیم.",
        summaryPoints: [
          "ده کارکردی که رناس به‌عنوان یک محدوده‌ی پاسخگو حمل می‌کند",
          "ابزارهای واقعی تجاری که این کار بر پایه‌ی آن‌ها اجرا می‌شود، توضیح داده شده",
          "کاری که رناس انجام نمی‌دهد، به‌صراحت بیان شده",
        ],
        meta: [
          { label: "محدوده کاری", value: "از مشخصات فنی تا تحویل" },
          { label: "نوع همکاری معمول", value: "یک نیازمندی واحد یا تأمین مستمر" },
        ],
        primaryCta: { label: "درخواست تأمین", href: "/request-supply" },
        secondaryCta: { label: "روند کار", href: "/how-it-works" },
      },
    },
    {
      type: "editorial_dossier",
      content: {
        eyebrow: "محدوده کاری",
        headline: "ده کارکرد، حمل‌شده به‌عنوان یک محدوده.",
        intro:
          "هر یک از موارد زیر یک کارکرد واقعی است که رناس در هر همکاری انجام می‌دهد — نه یک دسته‌بندی تبلیغاتی. در ادامه در پنج مرحله‌ای که یک نیازمندی واقعاً از آن‌ها عبور می‌کند، دسته‌بندی شده‌اند.",
        contentsLabel: "پرش به",
        chapters: [
          {
            id: "specification-sourcing",
            number: "۰۱",
            title: "مشخصات فنی و تأمین",
            body: [
              "تبدیل یک نیاز اعلام‌شده به مشخصاتی فنی و قابل‌تأمین، اولین کاری است که انجام می‌دهیم، پیش از تماس با هر تأمین‌کننده. نام یک قطعه یا یک عکس به ما می‌گوید خریدار فکر می‌کند به چه چیزی نیاز دارد؛ به‌تنهایی به‌ندرت می‌گوید چه چیزی واقعاً در مقصد جفت‌وجور می‌شود، عمل می‌کند و از گمرک عبور می‌کند.",
              "پس از وجود یک مشخصات فنی، تأمین‌کنندگان بر اساس همان مشخصات شناسایی می‌شوند — نه بر اساس نزدیک‌ترین نام محصول مشابهی که یک جستجو نشان می‌دهد. اینجا همان جایی است که مرجع‌گیری متقابل اورجینال هم رخ می‌دهد: تطبیق یک شماره فنی با معادل‌های قابل‌قبول، بدون کاهش پنهانی رتبه‌ی دوام یا عمر خدمت قطعه‌ی اصلی.",
            ],
            keyPointsTitle: "این چه چیزی را شامل می‌شود",
            keyPoints: ["ترجمه‌ی نیازمندی به مشخصات فنی", "شناسایی تأمین‌کننده بر اساس همان مشخصات", "مرجع‌گیری متقابل اورجینال و ارزیابی معادل"],
          },
          {
            id: "verification-negotiation",
            number: "۰۲",
            title: "تأیید و مذاکره",
            body: [
              "توانایی تأمین‌کننده و همخوانی محصول پیش از وجود یک تعهد ارزیابی می‌شوند، نه پس از شکست یکی. این یعنی بررسی اینکه آیا تأمین‌کننده از موجودی واقعی و در دسترس قیمت می‌دهد یا از یک نوبت تولید تأییدنشده، و اینکه آیا استاندارد کیفیت اعلام‌شده با آنچه مشخصات فنی واقعاً می‌خواهد همخوانی دارد.",
              "شرایط تجاری سپس در بافت مستندسازی و مسیری که باید از آن‌ها پشتیبانی کند، مذاکره می‌شود — یک قیمت مطلوب متصل به مسیر یا زمان تحویلی که واقعاً قابل‌اجرا نیست، قیمت مطلوب نیست، مشکلی است که به بعد همکاری موکول شده.",
            ],
            keyPointsTitle: "این چه چیزی را شامل می‌شود",
            keyPoints: ["تأیید توانایی تأمین‌کننده و وضعیت موجودی", "مذاکره‌ی شرایط تجاری متصل به یک مسیر واقع‌بینانه", "ساختار پرداخت متناسب با سطح اعتماد ایجادشده"],
          },
          {
            id: "documentation-inspection",
            number: "۰۳",
            title: "مستندسازی و بازرسی",
            body: [
              "اسناد به‌عنوان بخشی از برنامه آماده می‌شوند، نه اینکه واکنشی و پس از حرکت کالا جمع‌آوری شوند. طبقه‌بندی تعرفه، گواهی مبدأ و الزامات انطباق پیش از خروج محموله از تأمین‌کننده مشخص می‌شوند، چون کشف یک خلأ مستنداتی در مرز، گران‌ترین نقطه‌ی فرآیند برای کشف آن است.",
              "بازرسی پیش از ارسال در کنار مستندسازی به‌عنوان یک بررسی واقعی قرار دارد، نه یک تشریفات: تأیید مستقل اینکه آنچه مشخص شده واقعاً همان چیزی است که بارگیری می‌شود، پیش از آنکه اصلاح آن بسیار سخت‌تر و گران‌تر شود.",
            ],
            keyPointsTitle: "این چه چیزی را شامل می‌شود",
            keyPoints: ["طبقه‌بندی تعرفه و آماده‌سازی گواهی‌ها", "مستندسازی متناسب با الزامات مقصد مشخص", "بازرسی پیش از ارسال در برابر مشخصات اصلی"],
          },
          {
            id: "routing-customs",
            number: "۰۴",
            title: "مسیریابی و گمرک",
            body: [
              "انتخاب مسیر، هزینه را در برابر بار مستنداتی و زمان واقعی ترانزیت در مرز می‌سنجد — نه فاصله روی نقشه. حمل دریایی، ترانزیت زمینی از ترکیه، یا یک مسیر ترکیبی تجمیعی، هر کدام پروفایل متفاوتی دارند، و ارزان‌ترین گزینه و سریع‌ترین گزینه به‌ندرت یکی هستند.",
              "الزامات ترخیص گمرکی بسته به محصول، مسیر و مقصد متفاوت است، و آن‌ها تصمیم مسیریابی را شکل می‌دهند، نه اینکه منفعلانه از آن پیروی کنند. مسیری که روی کاغذ کارآمد به نظر می‌رسد اما بار ترخیص سنگین‌تری از آنچه مستندسازی می‌تواند پشتیبانی کند دارد، در عمل گزینه‌ی کارآمدی نیست.",
            ],
            keyPointsTitle: "این چه چیزی را شامل می‌شود",
            keyPoints: ["انتخاب مسیر با سنجش هم‌زمان هزینه، زمان و مستندسازی", "برنامه‌ریزی ترخیص گمرکی مخصوص مقصد", "کارنه تیر و ترتیبات حمل تجمیعی در موارد قابل‌اجرا"],
          },
          {
            id: "freight-handover",
            number: "۰۵",
            title: "حمل‌ونقل و تحویل نهایی",
            body: [
              "روش حمل، هزینه، ریسک و زمان‌بندی را با هم تغییر می‌دهد، پس به‌عنوان بخشی از همان برنامه‌ی مستندسازی و مسیریابی انتخاب می‌شود — نه چیزی که پس از ارسال توسط تأمین‌کننده اضافه شود. محدوده‌ی همکاری در یک بندر یا مرز تمام نمی‌شود؛ زمانی تمام می‌شود که قطعه فیزیکاً در دست خریدار باشد.",
              "آن تحویل نهایی به‌عنوان یک مرحله‌ی واقعی از همکاری با تأیید خودش در نظر گرفته می‌شود، نه یک تشریفات فرض‌شده پس از عبور کالا از گمرک.",
            ],
            keyPointsTitle: "این چه چیزی را شامل می‌شود",
            keyPoints: ["انتخاب روش حمل در کنار مسیر و مستندسازی", "پیگیری تحویل تا تحویل فیزیکی نهایی", "تأیید تطابق قطعه‌ی تحویل‌شده با مشخصات اصلی"],
          },
        ],
      },
    },
    // Proof by specificity: the instruments a buyer's own trade or logistics
    // team would recognise, instead of generic "trusted partner" claims.
    {
      type: "glossary",
      content: {
        eyebrow: "واژگان کاری",
        headline: "ابزارهایی که این حرفه واقعاً بر پایه‌ی آن‌ها می‌چرخد.",
        intro:
          "اگر این اصطلاحات برای تیم شما آشناست، ما به یک زبان صحبت می‌کنیم. اگر نیست، این نقطه‌ی شروع معقولی است برای درک اینکه یک همکاری تأمین مستند و قابل‌تأیید واقعاً شامل چه چیزی می‌شود.",
        entries: [
          { term: "اینکوترمز ۲۰۲۰", definition: "مجموعه‌ی قوانین بین‌المللی که دقیقاً تعیین می‌کند ریسک و هزینه کجا میان خریدار، تأمین‌کننده و حمل‌کننده منتقل می‌شود — پیش از حرکت محموله توافق می‌شود، نه بعد از بروز مشکل در حمل مورد بحث قرار می‌گیرد." },
          { term: "طبقه‌بندی HS", definition: "کد تعرفه‌ی سامانه‌ی هماهنگ‌شده که به یک محصول اختصاص می‌یابد و نرخ عوارض، نحوه‌ی ترخیص و در برخی مسیرها، اصلاً امکان ورود محصول را تعیین می‌کند." },
          { term: "پیش‌فاکتور", definition: "سند تجاری اولیه‌ای که خریدار معمولاً پیش از آزادسازی وجوه داخلی یا مجوزهای واردات در سمت خودش به آن نیاز دارد، پیش از فاکتور تجاری نهایی." },
          { term: "گواهی مبدأ", definition: "مدرک رسمی محل تولید یک محصول، که نحوه‌ی عوارض تحت توافق‌نامه‌های تجاری قابل‌اجرا و در برخی مسیرها، امکان ورود محصول را تعیین می‌کند.", aka: ["CoO"] },
          { term: "بارنامه دریایی", definition: "سندی که هم‌زمان به‌عنوان رسید کالا، قرارداد حمل و سند مالکیت عمل می‌کند — خطا در اینجا می‌تواند یک محموله را در بندر متوقف کند، فارغ از اینکه بقیه‌ی موارد چقدر درست بوده باشند.", aka: ["B/L"] },
          { term: "بارنامه CMR", definition: "سند استاندارد بین‌المللی حمل جاده‌ای که جابه‌جایی کالای زمینی را مدیریت می‌کند، مرتبط با محموله‌هایی که با کامیون از ترکیه و عراق عبور می‌کنند." },
          { term: "کارنه تیر", definition: "سندی گمرکی که به حمل جاده‌ای پلمب‌شده اجازه می‌دهد چندین مرز بین‌المللی را تحت یک ضمانت واحد عبور کند، بدون بازرسی کامل گمرکی در هر مرز." },
          { term: "بازرسی پیش از ارسال", definition: "بررسی فیزیکی و مستقلی که تأیید می‌کند کالای واقعاً بارگیری‌شده با کالای مشخص‌شده تطابق دارد — پیش از حرکت انجام می‌شود، در زمانی که هنوز اصلاح یک مغایرت ارزان است.", aka: ["PSI"] },
          { term: "اعتبار اسنادی", definition: "یک سازوکار پرداخت که در آن یک بانک پرداخت به تأمین‌کننده را در برابر ارائه‌ی اسناد مشخص‌شده تضمین می‌کند، در مواردی استفاده می‌شود که سطح اعتماد میان طرف‌ها هنوز از شرایط حساب باز پشتیبانی نمی‌کند.", aka: ["LC"] },
          { term: "لیست بسته‌بندی", definition: "تفکیک محتویات یک محموله در سطح کارتن که هم مقامات گمرکی و هم کارگاه دریافت‌کننده برای تأیید آنچه واقعاً رسیده به آن وابسته‌اند." },
          { term: "مرجع متقابل اورجینال", definition: "فرآیند تطبیق یک شماره فنی تولیدکننده‌ی اصلی با یک معادل قابل‌قبول، بدون کاهش پنهانی رتبه‌ی دوام، تلورانس یا عمر خدمت قطعه‌ی اصلی." },
          { term: "شرایط گارانتی", definition: "تعهد مشخصی که یک تأمین‌کننده واقعاً پس از قرارگیری قطعه در سرویس پشت آن می‌ایستد — متفاوت از یک ادعای کلی کیفیت، و ارزش تأیید کتبی پیش از وقوع خرابی را دارد، نه بعد از آن." },
        ],
      },
    },
    {
      type: "narrative_feature",
      content: {
        eyebrow: "مرز محدوده کاری",
        headline: "رناس چه چیزی نیست.",
        standfirst:
          "صراحت درباره‌ی مرز محدوده‌ی کاری‌مان، همان چیزی است که کار درون آن را قابل‌اعتماد می‌کند.",
        blocks: [
          {
            kind: "paragraph",
            text: "رناس یک تولیدکننده نیست. ما قطعاتی را که تأمین می‌کنیم تولید نمی‌کنیم، و طوری هم رفتار نمی‌کنیم که انگار تولید می‌کنیم — هر قطعه‌ای که در یک همکاری جابه‌جا می‌شود از تأمین‌کننده‌ای می‌آید که ارزیابی کرده‌ایم، نه از کارخانه‌ای که خودمان اداره می‌کنیم.",
          },
          {
            kind: "paragraph",
            text: "رناس همچنین یک فهرست راهنما نیست. ما یک همکاری را با ردوبدل شدن اطلاعات تماس یک تأمین‌کننده تمام‌شده در نظر نمی‌گیریم — تأیید، مستندسازی، مسیریابی و تحویل به‌عنوان بخشی از همان محدوده‌ی پاسخگو، توسط همان تیم، تا تحویل نهایی ادامه می‌یابد.",
          },
          {
            kind: "paragraph",
            text: "ما قیمتی را که نمی‌توانیم مستند کنیم پیشنهاد نمی‌دهیم، و زمان تحویلی را که در برابر مسیر واقعی و وضعیت موجودی تأمین‌کننده بررسی نکرده‌ایم تأیید نمی‌کنیم. جایی که یک نیازمندی واقعاً خارج از چیزی است که می‌توانیم مسئولانه تحویل دهیم، مستقیم می‌گوییم، به‌جای پذیرفتن همکاری و توضیح کمبود بعداً.",
          },
        ],
      },
    },
    {
      type: "cta",
      content: {
        headline: "نیازمندی‌ای در ذهن دارید؟",
        body: "با آنچه می‌دانید شروع کنید — تیم ما در تکمیل باقی جزئیات کمک می‌کند.",
        primaryCta: { label: "درخواست تأمین", href: "/request-supply" },
        secondaryCta: { label: "روند کار", href: "/how-it-works" },
      },
    },
  ], "fa");

  await publishPage("supply-solutions", "Supply Solutions", [
    {
      type: "page_masthead",
      content: {
        variant: "stacked",
        kicker: "SUPPLY SOLUTIONS",
        headline: "Parts sourced with intent, not just matched by name.",
        standfirst:
          "A capability set built around the parts that keep heavy vehicles moving — filtration through consumables — sourced against verified specification rather than the closest matching product listing.",
        intro:
          "Every category below represents suppliers RENAS has already evaluated and specifications we can cross-reference directly, not a generic parts list assembled for the sake of appearing comprehensive.",
        summaryPoints: [
          "Six component categories, with the specific sub-types we source within each",
          "What actually separates a documented capability from a plain category list",
          "Common sourcing questions, answered directly",
        ],
        meta: [
          { label: "FOCUS", value: "Heavy-vehicle components" },
          { label: "SOURCING TYPE", value: "OEM & verified equivalents" },
        ],
        primaryCta: { label: "REQUEST A COMPONENT", href: "/request-supply" },
        secondaryCta: { label: "WHAT WE DO", href: "/what-we-do" },
      },
    },
    // Structured, semantic tables — a category list becomes indexable
    // spec detail instead of a repeated card grid.
    {
      type: "spec_table",
      content: {
        eyebrow: "CATEGORY SPECIFICATION",
        headline: "Built around the parts that keep heavy vehicles moving.",
        intro: "Each group below lists the sub-types RENAS regularly sources within that category, along with the detail that actually determines whether a specific part is the correct one for a given application.",
        groups: [
          {
            id: "filtration",
            number: "01",
            title: "Filtration",
            description: "Oil, fuel and air filtration across major heavy-vehicle platforms, sourced and verified against service-interval specification.",
            columns: { term: "SUB-TYPE", detail: "SPECIFICATION FOCUS", note: "TYPICAL INTERVAL" },
            rows: [
              { term: "Oil filters", detail: "Filtration micron rating and bypass valve pressure matched to engine spec", note: "5,000–10,000 km" },
              { term: "Fuel filters", detail: "Water-separation capability, critical for common-rail diesel systems", note: "10,000–20,000 km" },
              { term: "Air filters", detail: "Dust-holding capacity matched to the operating environment", note: "Environment-dependent" },
            ],
          },
          {
            id: "engine-systems",
            number: "02",
            title: "Engine Systems",
            description: "Engine assemblies and major components sourced against exact specification, not a general model match.",
            columns: { term: "SUB-TYPE", detail: "SPECIFICATION FOCUS", note: "SOURCING NOTE" },
            rows: [
              { term: "Complete assemblies", detail: "Full engine units matched to chassis and duty rating", note: "Long lead time — plan ahead" },
              { term: "Cylinder heads & blocks", detail: "Casting number verified against engine serial", note: "OEM number required" },
              { term: "Turbochargers", detail: "Boost pressure and compressor mapping matched to application", note: "Core exchange often available" },
            ],
          },
          {
            id: "brake-systems",
            number: "03",
            title: "Brake Systems",
            description: "Brake discs, pads and related hardware verified for both dimensional fit and duty rating.",
            columns: { term: "SUB-TYPE", detail: "SPECIFICATION FOCUS", note: "DUTY RATING" },
            rows: [
              { term: "Ventilated discs", detail: "Thickness and ventilation pattern matched to thermal load", note: "Heavy-duty rated" },
              { term: "Brake pads", detail: "Friction compound matched to operating temperature range", note: "Standard / heavy-duty" },
              { term: "Callipers & hardware", detail: "Mounting and actuation type verified against axle spec", note: "Rebuild kits available" },
            ],
          },
          {
            id: "suspension",
            number: "04",
            title: "Suspension",
            description: "Suspension and tire assemblies for heavy-duty operating conditions, sourced with load rating as the primary specification.",
            columns: { term: "SUB-TYPE", detail: "SPECIFICATION FOCUS", note: "LOAD RATING" },
            rows: [
              { term: "Leaf & air springs", detail: "Load capacity and ride height matched to axle configuration", note: "Application-specific" },
              { term: "Shock absorbers", detail: "Damping rate matched to suspension type", note: "Standard / heavy-duty" },
              { term: "Twin-tire assemblies", detail: "Load index and speed rating verified for duty cycle", note: "Set-matched on request" },
            ],
          },
          {
            id: "electrical",
            number: "05",
            title: "Electrical",
            description: "Electrical components and circuitry sourced from verified suppliers, with fitment confirmed against the specific electrical architecture.",
            columns: { term: "SUB-TYPE", detail: "SPECIFICATION FOCUS", note: "SOURCING NOTE" },
            rows: [
              { term: "Starter motors", detail: "Torque output and mounting pattern matched to engine", note: "Rebuilt units available" },
              { term: "Alternators", detail: "Output current matched to vehicle electrical load", note: "OEM number required" },
              { term: "Sensors & harnesses", detail: "Connector type and signal protocol verified against architecture", note: "Version-specific" },
            ],
          },
          {
            id: "consumables",
            number: "06",
            title: "Consumables",
            description: "Ongoing consumable parts managed as scheduled repeat supply rather than repeated one-off requests.",
            columns: { term: "SUB-TYPE", detail: "SPECIFICATION FOCUS", note: "SUPPLY MODEL" },
            rows: [
              { term: "Belts & hoses", detail: "Material rating matched to operating temperature and pressure", note: "Scheduled replenishment" },
              { term: "Seals & gaskets", detail: "Compound compatibility with fluids in service", note: "Scheduled replenishment" },
              { term: "Fluids & lubricants", detail: "Specification matched to manufacturer service requirement", note: "Bulk supply available" },
            ],
          },
        ],
        footNote: "A category or sub-type not listed here is not automatically out of scope — see the sourcing questions below, or submit a requirement directly.",
      },
    },
    // Pacing: annotated stages after the dense spec tables, arguing that a
    // documented capability is more than a category list.
    {
      type: "stage_dossier",
      content: {
        eyebrow: "WHAT SITS BEHIND EACH CATEGORY",
        headline: "A category list is not a capability.",
        intro: "Every line in the tables above represents real, prior work — not a claim made for the sake of appearing comprehensive. This is what that work actually consists of.",
        stages: [
          {
            number: "01",
            title: "Supplier evaluation, done in advance",
            duration: "ONGOING, PER CATEGORY",
            body: "Before a category appears above, the suppliers behind it have already been evaluated for production capability, quality consistency and their ability to actually meet the duty ratings the category implies — not assessed for the first time when a specific request arrives.",
            inputsTitle: "WHAT THIS REQUIRES",
            inputs: ["Ongoing supplier relationship management", "Periodic re-verification as supplier capability changes"],
            outputsTitle: "WHAT IT PRODUCES",
            outputs: ["A shortlist of verified suppliers per category, ready when a request arrives"],
          },
          {
            number: "02",
            title: "Cross-reference groundwork",
            duration: "MAINTAINED CONTINUOUSLY",
            body: "OEM part numbers and their verified equivalents are cross-referenced ahead of demand, so that when a buyer sends a part number or a photograph, the specification work does not start from zero.",
            inputsTitle: "WHAT THIS REQUIRES",
            inputs: ["Access to OEM and aftermarket cross-reference data", "Technical review of claimed equivalents against original specification"],
            outputsTitle: "WHAT IT PRODUCES",
            outputs: ["A faster, more accurate response when a specific part is requested"],
          },
          {
            number: "03",
            title: "Route documentation, already understood",
            duration: "MAINTAINED PER ORIGIN",
            body: "The documentation and customs treatment for each category's typical country of origin is already understood before a request arrives, rather than researched reactively once a shipment needs to move.",
            inputsTitle: "WHAT THIS REQUIRES",
            inputs: ["Current knowledge of tariff classification per category", "Awareness of destination-specific clearance requirements"],
            outputsTitle: "WHAT IT PRODUCES",
            outputs: ["A realistic timeline given at the point of quotation, not discovered later"],
          },
        ],
        closingNote: "This is the difference between a catalogue and a capability — and it is why we would rather tell a buyer a part is outside our scope than quote something we cannot actually deliver.",
      },
    },
    {
      type: "faq",
      content: {
        eyebrow: "SOURCING QUESTIONS",
        headline: "What buyers ask before sending a part number.",
        items: [
          { question: "Do you supply OEM parts, aftermarket, or both?", answer: "Both. Where an OEM part is required we source it as specified; where a verified equivalent is acceptable we will present it alongside the OEM option with the trade-offs stated, so the choice stays yours." },
          { question: "Do you manufacture any of these parts yourselves?", answer: "No. RENAS sources from evaluated third-party suppliers and manages the trade and logistics process — we do not manufacture parts ourselves, and we do not present ourselves as doing so." },
          { question: "What if I only have a photo or a part off the vehicle?", answer: "That is a normal starting point. Send what you have and our team will work back to a sourceable specification — cross-referencing OEM numbers and equivalents before anything is quoted." },
          { question: "Do you handle repeat and scheduled supply?", answer: "Yes. Consumables and service-interval parts are usually better managed as ongoing replenishment against a known schedule rather than as repeated one-off requests." },
          { question: "My category isn't listed here — is it out of scope?", answer: "Not necessarily. If it belongs on a heavy vehicle, submit the requirement and we will tell you honestly whether we can source it rather than accepting it and finding out later." },
        ],
      },
    },
    {
      type: "cta",
      content: {
        headline: "Know the part you need?",
        body: "Send the specification, the part number, or just a photo — we will work back from whatever you have.",
        primaryCta: { label: "SUBMIT A REQUIREMENT", href: "/request-supply" },
        secondaryCta: { label: "HOW IT WORKS", href: "/how-it-works" },
      },
    },
  ]);

  await publishPage("supply-solutions", "راهکارهای تأمین", [
    {
      type: "page_masthead",
      content: {
        variant: "stacked",
        kicker: "راهکارهای تأمین",
        headline: "قطعاتی که با هدف تأمین شده‌اند، نه فقط با تطابق نام.",
        standfirst:
          "مجموعه‌ای از توانمندی‌ها که حول قطعاتی ساخته شده که خودروهای سنگین را در حرکت نگه می‌دارند — از فیلتراسیون تا مصرفی‌ها — بر پایه‌ی مشخصات تأییدشده تأمین می‌شود، نه نزدیک‌ترین فهرست محصول مشابه.",
        intro:
          "هر دسته‌بندی زیر نماینده‌ی تأمین‌کنندگانی است که رناس از پیش ارزیابی کرده و مشخصاتی است که می‌توانیم مستقیماً مرجع‌گیری متقابل کنیم، نه یک فهرست عمومی قطعات که فقط برای جامع به‌نظر رسیدن جمع شده باشد.",
        summaryPoints: [
          "شش دسته‌بندی قطعه، همراه با زیرمجموعه‌های مشخصی که در هر کدام تأمین می‌کنیم",
          "چیزی که واقعاً یک توانمندی مستند را از یک فهرست ساده‌ی دسته‌بندی جدا می‌کند",
          "پرسش‌های رایج تأمین، پاسخ‌داده‌شده به‌طور مستقیم",
        ],
        meta: [
          { label: "کانون توجه", value: "قطعات خودرو سنگین" },
          { label: "نوع تأمین", value: "اورجینال و معادل‌های تأییدشده" },
        ],
        primaryCta: { label: "درخواست یک قطعه", href: "/request-supply" },
        secondaryCta: { label: "کار ما", href: "/what-we-do" },
      },
    },
    // Structured, semantic tables — a category list becomes indexable
    // spec detail instead of a repeated card grid.
    {
      type: "spec_table",
      content: {
        eyebrow: "مشخصات دسته‌بندی",
        headline: "بر پایه‌ی قطعاتی که خودروهای سنگین را در حرکت نگه می‌دارند.",
        intro: "هر گروه زیر زیرمجموعه‌هایی را که رناس به‌طور منظم در آن دسته تأمین می‌کند فهرست می‌کند، همراه با جزئیاتی که واقعاً تعیین می‌کند آیا یک قطعه‌ی مشخص برای یک کاربرد معین درست است یا نه.",
        groups: [
          {
            id: "filtration",
            number: "۰۱",
            title: "فیلتراسیون",
            description: "فیلتراسیون روغن، سوخت و هوا در پلتفرم‌های اصلی خودرو سنگین، تأمین‌شده و تأییدشده بر اساس مشخصات بازه‌ی سرویس.",
            columns: { term: "زیرمجموعه", detail: "کانون مشخصات فنی", note: "بازه‌ی معمول" },
            rows: [
              { term: "فیلتر روغن", detail: "رتبه‌ی میکرون فیلتراسیون و فشار سوپاپ بای‌پس متناسب با مشخصات موتور", note: "۵٬۰۰۰ تا ۱۰٬۰۰۰ کیلومتر" },
              { term: "فیلتر سوخت", detail: "توانایی جداسازی آب، حیاتی برای سامانه‌های دیزل ریل مشترک", note: "۱۰٬۰۰۰ تا ۲۰٬۰۰۰ کیلومتر" },
              { term: "فیلتر هوا", detail: "ظرفیت نگهداری گرد و غبار متناسب با محیط عملیاتی", note: "وابسته به محیط" },
            ],
          },
          {
            id: "engine-systems",
            number: "۰۲",
            title: "سامانه‌های موتور",
            description: "مجموعه‌های موتور و قطعات اصلی تأمین‌شده بر اساس مشخصات دقیق، نه یک تطابق کلی مدل.",
            columns: { term: "زیرمجموعه", detail: "کانون مشخصات فنی", note: "نکته‌ی تأمین" },
            rows: [
              { term: "مجموعه‌های کامل", detail: "واحدهای کامل موتور متناسب با شاسی و رتبه‌ی دوام", note: "زمان تحویل طولانی — از پیش برنامه‌ریزی کنید" },
              { term: "سرسیلندر و بلوک", detail: "شماره‌ی قالب‌ریزی تأییدشده در برابر سریال موتور", note: "شماره فنی اورجینال لازم است" },
              { term: "توربوشارژر", detail: "فشار بوست و نقشه‌ی کمپرسور متناسب با کاربرد", note: "تعویض هسته اغلب در دسترس است" },
            ],
          },
          {
            id: "brake-systems",
            number: "۰۳",
            title: "سامانه‌های ترمز",
            description: "دیسک ترمز، لنت و سخت‌افزار مرتبط، تأییدشده هم از نظر تطابق ابعادی و هم رتبه‌ی دوام.",
            columns: { term: "زیرمجموعه", detail: "کانون مشخصات فنی", note: "رتبه‌ی دوام" },
            rows: [
              { term: "دیسک تهویه‌دار", detail: "ضخامت و الگوی تهویه متناسب با بار حرارتی", note: "رتبه‌بندی سنگین" },
              { term: "لنت ترمز", detail: "ترکیب اصطکاکی متناسب با بازه‌ی دمای عملیاتی", note: "استاندارد / سنگین" },
              { term: "کالیپر و سخت‌افزار", detail: "نوع نصب و عملکرد تأییدشده در برابر مشخصات اکسل", note: "کیت‌های تعمیر در دسترس" },
            ],
          },
          {
            id: "suspension",
            number: "۰۴",
            title: "تعلیق",
            description: "مجموعه‌های تعلیق و لاستیک برای شرایط عملیاتی سنگین، تأمین‌شده با رتبه‌ی بار به‌عنوان مشخصه‌ی اصلی.",
            columns: { term: "زیرمجموعه", detail: "کانون مشخصات فنی", note: "رتبه‌ی بار" },
            rows: [
              { term: "فنر تیغه‌ای و بادی", detail: "ظرفیت بار و ارتفاع سواری متناسب با پیکربندی اکسل", note: "مخصوص کاربرد" },
              { term: "کمک‌فنر", detail: "نرخ میرایی متناسب با نوع تعلیق", note: "استاندارد / سنگین" },
              { term: "مجموعه‌ی دوچرخ", detail: "شاخص بار و رتبه‌ی سرعت تأییدشده برای چرخه‌ی کاری", note: "ست‌های متناسب بر اساس درخواست" },
            ],
          },
          {
            id: "electrical",
            number: "۰۵",
            title: "برق",
            description: "قطعات و مدارهای برقی تأمین‌شده از تأمین‌کنندگان تأییدشده، با تطابق تأییدشده در برابر معماری برقی مشخص.",
            columns: { term: "زیرمجموعه", detail: "کانون مشخصات فنی", note: "نکته‌ی تأمین" },
            rows: [
              { term: "استارت", detail: "گشتاور خروجی و الگوی نصب متناسب با موتور", note: "واحدهای تعمیرشده در دسترس" },
              { term: "آلترناتور", detail: "جریان خروجی متناسب با بار برقی خودرو", note: "شماره فنی اورجینال لازم است" },
              { term: "سنسور و هارنس", detail: "نوع کانکتور و پروتکل سیگنال تأییدشده در برابر معماری", note: "مخصوص نسخه" },
            ],
          },
          {
            id: "consumables",
            number: "۰۶",
            title: "مصرفی",
            description: "قطعات مصرفی مستمر که به‌عنوان تأمین تکراری زمان‌بندی‌شده مدیریت می‌شوند، نه درخواست‌های جداگانه‌ی مکرر.",
            columns: { term: "زیرمجموعه", detail: "کانون مشخصات فنی", note: "مدل تأمین" },
            rows: [
              { term: "تسمه و شیلنگ", detail: "رتبه‌ی جنس متناسب با دما و فشار عملیاتی", note: "بازپرشدن زمان‌بندی‌شده" },
              { term: "واشر و کاسه‌نمد", detail: "سازگاری ترکیب با سیالات در سرویس", note: "بازپرشدن زمان‌بندی‌شده" },
              { term: "روغن و روان‌کننده", detail: "مشخصات متناسب با الزام سرویس سازنده", note: "تأمین حجمی در دسترس" },
            ],
          },
        ],
        footNote: "یک دسته‌بندی یا زیرمجموعه که اینجا فهرست نشده، لزوماً خارج از محدوده نیست — پرسش‌های تأمین زیر را ببینید یا مستقیماً یک نیازمندی ثبت کنید.",
      },
    },
    // Pacing: annotated stages after the dense spec tables, arguing that a
    // documented capability is more than a category list.
    {
      type: "stage_dossier",
      content: {
        eyebrow: "پشت هر دسته‌بندی چه چیزی هست",
        headline: "یک فهرست دسته‌بندی، یک توانمندی نیست.",
        intro: "هر خط در جدول‌های بالا نماینده‌ی کاری واقعی و پیشین است — نه ادعایی که فقط برای جامع به‌نظر رسیدن مطرح شده. این همان چیزی است که آن کار واقعاً شامل آن می‌شود.",
        stages: [
          {
            number: "۰۱",
            title: "ارزیابی تأمین‌کننده، از پیش انجام‌شده",
            duration: "مستمر، به ازای هر دسته",
            body: "پیش از اینکه یک دسته‌بندی در بالا ظاهر شود، تأمین‌کنندگان پشت آن از نظر توانایی تولید، ثبات کیفیت و توانایی واقعی برآورده کردن رتبه‌ی دوامی که آن دسته دلالت دارد، از پیش ارزیابی شده‌اند — نه اینکه اولین بار زمان رسیدن یک درخواست مشخص ارزیابی شوند.",
            inputsTitle: "این چه چیزی نیاز دارد",
            inputs: ["مدیریت مستمر رابطه با تأمین‌کننده", "بازتأیید دوره‌ای همزمان با تغییر توانایی تأمین‌کننده"],
            outputsTitle: "این چه چیزی تولید می‌کند",
            outputs: ["فهرستی کوتاه از تأمین‌کنندگان تأییدشده به ازای هر دسته، آماده در زمان رسیدن درخواست"],
          },
          {
            number: "۰۲",
            title: "زیرساخت مرجع‌گیری متقابل",
            duration: "به‌طور مستمر نگهداری می‌شود",
            body: "شماره‌های فنی اورجینال و معادل‌های تأییدشده‌ی آن‌ها پیش از وجود تقاضا مرجع‌گیری متقابل می‌شوند، تا وقتی خریدار یک شماره فنی یا عکس می‌فرستد، کار مشخصات فنی از صفر شروع نشود.",
            inputsTitle: "این چه چیزی نیاز دارد",
            inputs: ["دسترسی به داده‌های مرجع‌گیری متقابل اورجینال و بدل", "بازبینی فنی معادل‌های ادعاشده در برابر مشخصات اصلی"],
            outputsTitle: "این چه چیزی تولید می‌کند",
            outputs: ["پاسخی سریع‌تر و دقیق‌تر زمانی که یک قطعه‌ی مشخص درخواست می‌شود"],
          },
          {
            number: "۰۳",
            title: "مستندسازی مسیر، از پیش درک‌شده",
            duration: "به ازای هر مبدأ نگهداری می‌شود",
            body: "مستندسازی و نحوه‌ی برخورد گمرکی برای کشور مبدأ معمول هر دسته، پیش از رسیدن یک درخواست از پیش درک شده، نه اینکه واکنشی و زمانی که یک محموله باید حرکت کند بررسی شود.",
            inputsTitle: "این چه چیزی نیاز دارد",
            inputs: ["دانش به‌روز طبقه‌بندی تعرفه به ازای هر دسته", "آگاهی از الزامات ترخیص مخصوص مقصد"],
            outputsTitle: "این چه چیزی تولید می‌کند",
            outputs: ["زمان‌بندی واقع‌بینانه‌ای که در لحظه‌ی قیمت‌گذاری ارائه می‌شود، نه اینکه بعداً کشف شود"],
          },
        ],
        closingNote: "این تفاوت میان یک کاتالوگ و یک توانمندی است — و به همین دلیل ترجیح می‌دهیم به خریدار بگوییم قطعه‌ای خارج از محدوده‌ی ماست، تا اینکه چیزی را قیمت بدهیم که واقعاً نمی‌توانیم تحویل دهیم.",
      },
    },
    {
      type: "faq",
      content: {
        eyebrow: "پرسش‌های تأمین",
        headline: "چیزی که خریداران پیش از ارسال شماره فنی می‌پرسند.",
        items: [
          { question: "قطعات اورجینال، بدل، یا هر دو را تأمین می‌کنید؟", answer: "هر دو. در مواردی که قطعه‌ی اورجینال لازم باشد، طبق مشخصات تأمین می‌کنیم؛ در مواردی که معادل تأییدشده قابل‌قبول باشد، آن را در کنار گزینه‌ی اورجینال و همراه با توضیح تفاوت‌ها ارائه می‌دهیم تا انتخاب نهایی با شما باشد." },
          { question: "آیا خودتان این قطعات را تولید می‌کنید؟", answer: "خیر. رناس از تأمین‌کنندگان ثالث تأییدشده تأمین می‌کند و فرآیند تجارت و لجستیک را مدیریت می‌کند — ما خودمان قطعه تولید نمی‌کنیم و چنین ادعایی هم نداریم." },
          { question: "اگر فقط یک عکس یا قطعه‌ی جدا شده از خودرو داشته باشم چه؟", answer: "این یک نقطه‌ی شروع معمول است. آنچه دارید را ارسال کنید تا تیم ما با مرجع‌گیری از شماره‌های اورجینال و معادل‌ها، به یک مشخصه‌ی قابل‌تأمین برسد — پیش از هرگونه قیمت‌گذاری." },
          { question: "آیا تأمین تکراری و زمان‌بندی‌شده هم انجام می‌دهید؟", answer: "بله. قطعات مصرفی و قطعات با بازه‌ی سرویس دوره‌ای معمولاً بهتر است به‌صورت تأمین مستمر طبق یک برنامه‌ی مشخص مدیریت شوند تا درخواست‌های جداگانه‌ی مکرر." },
          { question: "دسته‌بندی من اینجا فهرست نشده — یعنی خارج از محدوده است؟", answer: "لزوماً نه. اگر قطعه مربوط به یک خودروی سنگین است، درخواست را ثبت کنید تا صادقانه بگوییم امکان تأمین آن هست یا نه، به‌جای پذیرفتن درخواست و متوجه‌شدن بعدی." },
        ],
      },
    },
    {
      type: "cta",
      content: {
        headline: "قطعه‌ای که نیاز دارید را می‌دانید؟",
        body: "مشخصات، شماره فنی، یا فقط یک عکس بفرستید — ما از همان‌جا شروع می‌کنیم.",
        primaryCta: { label: "ثبت یک نیازمندی", href: "/request-supply" },
        secondaryCta: { label: "روند کار", href: "/how-it-works" },
      },
    },
  ], "fa");

  await publishPage("how-it-works", "How It Works", [
    {
      type: "page_masthead",
      content: {
        variant: "indexed",
        kicker: "HOW IT WORKS",
        headline: "From request to delivery, one controlled process.",
        standfirst:
          "Every requirement moves through the same disciplined sequence — nothing skipped, nothing assumed. Five stages define the shape of the process; five different factors define how long it actually takes.",
        intro:
          "This page sets out both: what actually happens at each stage, and the specific variables that determine whether a requirement moves in days or in weeks — so the timeline you're given is a real one, not an optimistic placeholder.",
        summaryPoints: ["Requirement", "Market & Verification", "Commercial Terms", "Route & Logistics", "Delivery"],
        meta: [
          { label: "TYPICAL FIRST RESPONSE", value: "Within one business day" },
          { label: "TIMELINE BASIS", value: "Set after requirement review, not before" },
        ],
        primaryCta: { label: "REQUEST SUPPLY", href: "/request-supply" },
        secondaryCta: { label: "SUPPLY SOLUTIONS", href: "/supply-solutions" },
      },
    },
    {
      type: "stage_dossier",
      content: {
        eyebrow: "THE PROCESS",
        headline: "Five stages, in order, every time.",
        intro: "Each stage below has explicit inputs and outputs — what we need from you to move forward, and what you actually receive once it's complete.",
        stages: [
          {
            number: "01",
            title: "Requirement",
            duration: "TYPICALLY 1–2 DAYS",
            body: "We translate what you need into a specific, sourceable product — part number or not. A photograph, a vehicle model, or a description of a failure is enough to start; the specification work happens on our side, not as a precondition for engaging with us.",
            inputsTitle: "WHAT WE NEED",
            inputs: ["Whatever you already have — part number, photo, model, or failure description"],
            outputsTitle: "WHAT YOU GET",
            outputs: ["A confirmed, sourceable specification", "An honest read on whether the requirement is realistic as stated"],
          },
          {
            number: "02",
            title: "Market & Verification",
            duration: "TYPICALLY 2–5 DAYS",
            body: "Suppliers are evaluated for capability and product alignment, not just price — including whether quoted availability is real stock or an unconfirmed production slot, and whether the supplier's quality standard actually matches the specification.",
            inputsTitle: "WHAT WE NEED",
            inputs: ["Any preference for OEM vs. verified equivalent, if you have one"],
            outputsTitle: "WHAT YOU GET",
            outputs: ["A shortlist of verified suppliers", "Clarity on real availability vs. production lead time"],
          },
          {
            number: "03",
            title: "Commercial Terms",
            duration: "TYPICALLY 2–3 DAYS",
            body: "Terms are negotiated in the context of documentation and logistics that can actually support them — a favourable price tied to a route or lead time that cannot be delivered is not, in practice, a favourable price.",
            inputsTitle: "WHAT WE NEED",
            inputs: ["Budget parameters or approval constraints, if applicable"],
            outputsTitle: "WHAT YOU GET",
            outputs: ["Agreed commercial terms with a realistic delivery commitment", "A payment structure appropriate to the engagement"],
          },
          {
            number: "04",
            title: "Route & Logistics",
            duration: "VARIES BY ORIGIN & ROUTE",
            body: "Documents, route and transport are planned together as one system — not three separate handoffs assembled reactively once goods are already moving. Documentation is prepared ahead of departure, not discovered as missing at the border.",
            inputsTitle: "WHAT WE NEED",
            inputs: ["Confirmation of the exact delivery destination and any receiving constraints"],
            outputsTitle: "WHAT YOU GET",
            outputs: ["A realistic transit timeline", "Full shipment documentation, prepared ahead of arrival"],
          },
          {
            number: "05",
            title: "Delivery",
            duration: "CONFIRMED AT HANDOVER",
            body: "The requirement is complete when the part physically arrives and is confirmed against the original specification — not when a supplier is introduced, and not when goods clear customs.",
            inputsTitle: "WHAT WE NEED",
            inputs: ["Confirmation of receipt and condition on arrival"],
            outputsTitle: "WHAT YOU GET",
            outputs: ["The part, verified against the original specification", "A closed engagement, with any warranty terms on record"],
          },
        ],
        closingNote: "Nothing above is skipped to save time on a single engagement — the stages exist because skipping one is exactly how a shipment ends up stuck at a border with a documentation gap nobody caught earlier.",
      },
    },
    // Argument-led: the five stages above are the easy part to state. This
    // glossary does the real work — arguing the timeline is set by factors,
    // not by the number of stages.
    {
      type: "glossary",
      content: {
        eyebrow: "WHAT SHAPES THE TIMELINE",
        headline: "Five stages is the shape of the process. These five factors set its pace.",
        intro: "This is why a realistic timeline is given once a requirement is understood, and not before — each of the following can independently add days or weeks to an otherwise straightforward request.",
        entries: [
          { term: "Specification precision", definition: "A part number with a verified cross-reference moves immediately. A photograph and a vehicle model means specification work happens first — that work is not delay, it is what prevents the wrong part arriving three weeks later.", aka: ["SPEC"] },
          { term: "Origin", definition: "East Asia, the Gulf and Turkey each carry a different transit profile, documentation burden and consolidation opportunity. The cheapest origin and the fastest origin are rarely the same one.", aka: ["SOURCING ORIGIN"] },
          { term: "Stock status", definition: "Ex-stock availability and a production slot are different timelines wearing the same quotation. We verify which one is actually on offer before it becomes a commitment on your side.", aka: ["EX-STOCK VS. PRODUCTION"] },
          { term: "Documentation requirement", definition: "Certificates of origin, conformity requirements and tariff classification are decided at the planning stage. Discovering a documentation gap at the border is the single most expensive way to find out it existed.", aka: ["DOCS"] },
          { term: "Route", definition: "Sea freight, overland through Turkey, or a consolidated mixed route each change cost, risk and transit time together. The route is chosen alongside the documentation, not after it.", aka: ["ROUTING"] },
        ],
      },
    },
    {
      type: "faq",
      content: {
        eyebrow: "WORKING WITH US",
        headline: "Practical questions about the engagement.",
        items: [
          { question: "What do you need from me to start?", answer: "Whatever you already have — a part number, a photo, a vehicle model, or just a description of the failure. We work back from there rather than asking you to produce a specification before we will engage." },
          { question: "Is there a minimum order quantity?", answer: "MOQ varies by supplier and part rather than by category. We surface it during verification, so you see it before a commitment exists rather than after." },
          { question: "How do I know where my request has reached?", answer: "Each requirement moves through the five stages above, and you are told which stage it is in and what is outstanding — including when the honest answer is that a supplier has not come back to us yet." },
          { question: "What happens if a part arrives wrong or damaged?", answer: "It stays our problem. Pre-shipment inspection exists to catch it earlier, but where something does go wrong we handle the supplier claim and the replacement rather than handing you a contact and stepping back." },
          { question: "Can you work with our existing freight forwarder?", answer: "Yes. Where you already have a forwarder or a customs broker you trust, we plan the documentation and routing around them instead of insisting on our own chain." },
        ],
      },
    },
    {
      type: "cta",
      content: {
        headline: "Ready to start?",
        body: "Build your requirement and our team will take it from there.",
        primaryCta: { label: "START A SUPPLY REQUEST", href: "/request-supply" },
        secondaryCta: { label: "SUPPLY SOLUTIONS", href: "/supply-solutions" },
      },
    },
  ]);

  await publishPage("how-it-works", "روند کار", [
    {
      type: "page_masthead",
      content: {
        variant: "indexed",
        kicker: "روند کار",
        headline: "از درخواست تا تحویل، یک فرآیند کنترل‌شده.",
        standfirst:
          "هر نیازمندی از یک توالی منظم یکسان عبور می‌کند — چیزی حذف نمی‌شود، چیزی فرض گرفته نمی‌شود. پنج مرحله شکل فرآیند را تعیین می‌کند؛ پنج عامل متفاوت تعیین می‌کند چقدر واقعاً طول می‌کشد.",
        intro:
          "این صفحه هر دو را بیان می‌کند: در هر مرحله واقعاً چه اتفاقی می‌افتد، و متغیرهای مشخصی که تعیین می‌کند یک نیازمندی در چند روز حرکت می‌کند یا چند هفته — تا زمان‌بندی‌ای که به شما داده می‌شود واقعی باشد، نه یک عدد خوش‌بینانه.",
        summaryPoints: ["نیازمندی", "بازار و تأیید", "شرایط تجاری", "مسیر و لجستیک", "تحویل"],
        meta: [
          { label: "اولین پاسخ معمول", value: "طی یک روز کاری" },
          { label: "مبنای زمان‌بندی", value: "پس از بررسی نیازمندی تعیین می‌شود، نه پیش از آن" },
        ],
        primaryCta: { label: "درخواست تأمین", href: "/request-supply" },
        secondaryCta: { label: "راهکارهای تأمین", href: "/supply-solutions" },
      },
    },
    {
      type: "stage_dossier",
      content: {
        eyebrow: "فرآیند",
        headline: "پنج مرحله، به‌ترتیب، هر بار.",
        intro: "هر مرحله در زیر ورودی و خروجی مشخصی دارد — چیزی که از شما نیاز داریم تا پیش برویم، و چیزی که واقعاً پس از تکمیل آن دریافت می‌کنید.",
        stages: [
          {
            number: "۰۱",
            title: "نیازمندی",
            duration: "معمولاً ۱ تا ۲ روز",
            body: "آنچه نیاز دارید را به یک محصول مشخص و قابل‌تأمین ترجمه می‌کنیم — با شماره فنی یا بدون آن. یک عکس، یک مدل خودرو، یا توضیح یک خرابی برای شروع کافی است؛ کار مشخصات فنی در سمت ما انجام می‌شود، نه به‌عنوان پیش‌شرط همکاری با ما.",
            inputsTitle: "چیزی که نیاز داریم",
            inputs: ["هرچه در حال حاضر دارید — شماره فنی، عکس، مدل، یا توضیح خرابی"],
            outputsTitle: "چیزی که دریافت می‌کنید",
            outputs: ["مشخصاتی تأییدشده و قابل‌تأمین", "ارزیابی صادقانه از اینکه آیا نیازمندی همان‌طور که بیان شده واقع‌بینانه است"],
          },
          {
            number: "۰۲",
            title: "بازار و تأیید",
            duration: "معمولاً ۲ تا ۵ روز",
            body: "تأمین‌کنندگان از نظر توانایی و همخوانی محصول ارزیابی می‌شوند، نه فقط قیمت — از جمله اینکه آیا موجودی اعلام‌شده واقعی است یا یک نوبت تولید تأییدنشده، و آیا استاندارد کیفیت تأمین‌کننده واقعاً با مشخصات فنی همخوانی دارد.",
            inputsTitle: "چیزی که نیاز داریم",
            inputs: ["هرگونه ترجیح میان اورجینال و معادل تأییدشده، در صورت وجود"],
            outputsTitle: "چیزی که دریافت می‌کنید",
            outputs: ["فهرستی کوتاه از تأمین‌کنندگان تأییدشده", "شفافیت درباره‌ی موجودی واقعی در برابر زمان تولید"],
          },
          {
            number: "۰۳",
            title: "شرایط تجاری",
            duration: "معمولاً ۲ تا ۳ روز",
            body: "شرایط در بافت مستندسازی و لجستیکی که واقعاً می‌تواند از آن‌ها پشتیبانی کند مذاکره می‌شود — قیمتی مطلوب که به مسیر یا زمان تحویلی وابسته است که قابل‌اجرا نیست، در عمل قیمت مطلوبی نیست.",
            inputsTitle: "چیزی که نیاز داریم",
            inputs: ["پارامترهای بودجه یا محدودیت‌های تأیید، در صورت وجود"],
            outputsTitle: "چیزی که دریافت می‌کنید",
            outputs: ["شرایط تجاری توافق‌شده با تعهد تحویل واقع‌بینانه", "ساختار پرداخت متناسب با همکاری"],
          },
          {
            number: "۰۴",
            title: "مسیر و لجستیک",
            duration: "بسته به مبدأ و مسیر متفاوت است",
            body: "اسناد، مسیر و حمل‌ونقل با هم به‌عنوان یک سامانه برنامه‌ریزی می‌شوند — نه سه انتقال جداگانه که واکنشی و پس از حرکت کالا جمع‌آوری شوند. مستندسازی پیش از خروج آماده می‌شود، نه اینکه در مرز کمبود آن کشف شود.",
            inputsTitle: "چیزی که نیاز داریم",
            inputs: ["تأیید مقصد دقیق تحویل و هرگونه محدودیت دریافت"],
            outputsTitle: "چیزی که دریافت می‌کنید",
            outputs: ["زمان‌بندی واقع‌بینانه‌ی ترانزیت", "مستندات کامل محموله، آماده‌شده پیش از رسیدن"],
          },
          {
            number: "۰۵",
            title: "تحویل",
            duration: "در لحظه‌ی تحویل تأیید می‌شود",
            body: "نیازمندی زمانی کامل است که قطعه فیزیکاً برسد و در برابر مشخصات اصلی تأیید شود — نه زمانی که یک تأمین‌کننده معرفی می‌شود، و نه زمانی که کالا از گمرک عبور می‌کند.",
            inputsTitle: "چیزی که نیاز داریم",
            inputs: ["تأیید دریافت و وضعیت کالا در لحظه‌ی رسیدن"],
            outputsTitle: "چیزی که دریافت می‌کنید",
            outputs: ["قطعه، تأییدشده در برابر مشخصات اصلی", "یک همکاری بسته‌شده، با هرگونه شرایط گارانتی ثبت‌شده"],
          },
        ],
        closingNote: "هیچ‌کدام از موارد بالا برای صرفه‌جویی در زمان یک همکاری واحد حذف نمی‌شود — این مراحل وجود دارند چون حذف یکی از آن‌ها دقیقاً همان راهی است که یک محموله در مرز با یک خلأ مستنداتی که کسی زودتر متوجه نشده، گیر می‌کند.",
      },
    },
    // Argument-led: the five stages above are the easy part to state. This
    // glossary does the real work — arguing the timeline is set by factors,
    // not by the number of stages.
    {
      type: "glossary",
      content: {
        eyebrow: "چه چیزی زمان‌بندی را شکل می‌دهد",
        headline: "پنج مرحله شکل فرآیند است. این پنج عامل سرعت آن را تعیین می‌کند.",
        intro: "به همین دلیل است که زمان‌بندی واقع‌بینانه زمانی داده می‌شود که یک نیازمندی درک شده باشد، نه پیش از آن — هر یک از موارد زیر می‌تواند به‌طور مستقل روزها یا هفته‌ها به یک درخواست در ظاهر ساده اضافه کند.",
        entries: [
          { term: "دقت مشخصات فنی", definition: "یک شماره فنی با مرجع متقابل تأییدشده بلافاصله حرکت می‌کند. یک عکس و یک مدل خودرو یعنی کار مشخصات فنی ابتدا انجام می‌شود — آن کار تأخیر نیست، همان چیزی است که از رسیدن قطعه‌ی اشتباه سه هفته بعد جلوگیری می‌کند.", aka: ["مشخصات فنی"] },
          { term: "مبدأ", definition: "شرق آسیا، خلیج فارس و ترکیه هر کدام پروفایل ترانزیت، بار مستنداتی و فرصت تجمیعی متفاوتی دارند. ارزان‌ترین مبدأ و سریع‌ترین مبدأ به‌ندرت یکی هستند.", aka: ["مبدأ تأمین"] },
          { term: "وضعیت موجودی", definition: "موجودی واقعی و یک نوبت تولید، زمان‌بندی‌های متفاوتی هستند که همان قیمت پیشنهادی را می‌پوشانند. ما پیش از تبدیل شدن به یک تعهد در سمت شما، بررسی می‌کنیم کدام‌یک واقعاً پیشنهاد شده است.", aka: ["موجودی در برابر تولید"] },
          { term: "الزام مستنداتی", definition: "گواهی مبدأ، الزامات انطباق و طبقه‌بندی تعرفه در مرحله‌ی برنامه‌ریزی تعیین می‌شوند. کشف یک خلأ مستنداتی در مرز، گران‌ترین راه برای فهمیدن وجود آن است.", aka: ["مستندات"] },
          { term: "مسیر", definition: "حمل دریایی، زمینی از ترکیه، یا یک مسیر ترکیبی تجمیعی، هر کدام هزینه، ریسک و زمان ترانزیت را با هم تغییر می‌دهند. مسیر همراه با مستندسازی انتخاب می‌شود، نه بعد از آن.", aka: ["مسیریابی"] },
        ],
      },
    },
    {
      type: "faq",
      content: {
        eyebrow: "همکاری با ما",
        headline: "پرسش‌های عملی درباره‌ی همکاری.",
        items: [
          { question: "برای شروع به چه چیزی از من نیاز دارید؟", answer: "هرچه که در حال حاضر دارید — شماره فنی، عکس، مدل خودرو، یا فقط توضیح خرابی. ما از همان‌جا شروع می‌کنیم، بدون اینکه از شما بخواهیم پیش از تعامل، مشخصات کامل ارائه دهید." },
          { question: "آیا حداقل تعداد سفارش دارید؟", answer: "حداقل سفارش بسته به تأمین‌کننده و قطعه متفاوت است، نه بر اساس دسته‌بندی. این موضوع را در مرحله‌ی تأیید مشخص می‌کنیم، یعنی پیش از ایجاد تعهد، نه بعد از آن." },
          { question: "چطور بفهمم درخواستم به کجا رسیده؟", answer: "هر درخواست از پنج مرحله‌ی بالا عبور می‌کند، و به شما گفته می‌شود در کدام مرحله است و چه چیزی باقی مانده — حتی اگر پاسخ صادقانه این باشد که تأمین‌کننده هنوز پاسخ نداده است." },
          { question: "اگر قطعه اشتباه یا آسیب‌دیده برسد چه می‌شود؟", answer: "مسئولیت آن با ماست. بازرسی پیش از ارسال برای شناسایی زودتر مشکل وجود دارد، اما اگر مشکلی پیش بیاید، ما خودمان پیگیری ادعا از تأمین‌کننده و جایگزینی را انجام می‌دهیم، نه اینکه فقط یک مسیر تماس به شما بدهیم." },
          { question: "آیا با شرکت حمل‌ونقل فعلی ما هم همکاری می‌کنید؟", answer: "بله. اگر شرکت حمل‌ونقل یا کارگزار گمرکی مورد اعتماد خودتان را دارید، مستندسازی و مسیریابی را حول همان‌ها برنامه‌ریزی می‌کنیم، نه اینکه زنجیره‌ی خودمان را تحمیل کنیم." },
        ],
      },
    },
    {
      type: "cta",
      content: {
        headline: "آماده‌ی شروع هستید؟",
        body: "درخواست خود را بسازید و تیم ما آن را از همان‌جا پیش می‌برد.",
        primaryCta: { label: "شروع درخواست تأمین", href: "/request-supply" },
        secondaryCta: { label: "راهکارهای تأمین", href: "/supply-solutions" },
      },
    },
  ], "fa");

  await publishPage("request-supply", "Request Supply", [
    {
      type: "rich_text",
      content: {
        html: "<p>Start with what you know — product, part number if you have one, quantity and destination. The RENAS team will clarify the rest and follow up with next steps.</p>",
      },
    },
  ]);

  await publishPage("privacy", "Privacy Policy", [
    {
      type: "rich_text",
      content: {
        html: `
          <p><strong>Last updated: 2026</strong></p>
          <p>This Privacy Policy explains how RENAS Group ("RENAS", "we", "us") collects, uses and protects information when you use this website or submit a supply requirement to us.</p>

          <h2>Information we collect</h2>
          <p>When you submit a supply request, contact form, or otherwise communicate with us, we may collect your name, company name, email address, phone number, and the details of your requirement or message. We do not collect payment or financial account information through this website.</p>

          <h2>How we use your information</h2>
          <p>We use the information you provide to respond to supply requirements, coordinate sourcing, verification and logistics on your behalf, and to communicate with you about the status of a request. We do not sell or rent your personal information to third parties.</p>

          <h2>Sharing with suppliers and partners</h2>
          <p>Where necessary to fulfil a supply request, relevant details of a requirement (such as product specification, quantity and destination) may be shared with evaluated suppliers, logistics partners or customs agents involved in that specific request. We do not share your contact information beyond what is needed to execute the request.</p>

          <h2>Data retention</h2>
          <p>We retain submitted requirement and contact information for as long as necessary to fulfil the request and to maintain records for legitimate business, legal and accounting purposes.</p>

          <h2>Your rights</h2>
          <p>You may request access to, correction of, or deletion of the personal information we hold about you by contacting us using the details below.</p>

          <h2>Contact</h2>
          <p>Questions about this Privacy Policy can be directed to <a href="mailto:hello@renasxgroup.com">hello@renasxgroup.com</a>.</p>
        `,
      },
    },
  ]);

  await publishPage("request-supply", "درخواست تأمین", [
    {
      type: "rich_text",
      content: {
        html: "<p>با آنچه می‌دانید شروع کنید — محصول، شماره فنی در صورت وجود، تعداد و مقصد. تیم رناس باقی موارد را روشن می‌کند و مراحل بعدی را پیگیری خواهد کرد.</p>",
      },
    },
  ], "fa");

  await publishPage("privacy", "حریم خصوصی", [
    {
      type: "rich_text",
      content: {
        html: `
          <p><strong>آخرین به‌روزرسانی: ۲۰۲۶</strong></p>
          <p>این سیاست حریم خصوصی توضیح می‌دهد که گروه رناس («رناس»، «ما») چگونه اطلاعات را هنگام استفاده‌ی شما از این وب‌سایت یا ثبت یک نیازمندی تأمین، جمع‌آوری، استفاده و محافظت می‌کند.</p>

          <h2>اطلاعاتی که جمع‌آوری می‌کنیم</h2>
          <p>هنگامی که یک درخواست تأمین، فرم تماس ثبت می‌کنید یا به‌شکل دیگری با ما ارتباط برقرار می‌کنید، ممکن است نام، نام شرکت، آدرس ایمیل، شماره تلفن و جزئیات نیازمندی یا پیام شما را جمع‌آوری کنیم. ما از طریق این وب‌سایت اطلاعات پرداخت یا حساب مالی جمع‌آوری نمی‌کنیم.</p>

          <h2>چگونه از اطلاعات شما استفاده می‌کنیم</h2>
          <p>ما از اطلاعاتی که ارائه می‌دهید برای پاسخ به درخواست‌های تأمین، هماهنگی تأمین، تأیید و لجستیک از طرف شما، و برای اطلاع‌رسانی درباره‌ی وضعیت یک درخواست استفاده می‌کنیم. ما اطلاعات شخصی شما را به شخص ثالث نمی‌فروشیم یا اجاره نمی‌دهیم.</p>

          <h2>اشتراک‌گذاری با تأمین‌کنندگان و همکاران</h2>
          <p>در مواردی که برای انجام یک درخواست تأمین لازم باشد، جزئیات مرتبط یک نیازمندی (مانند مشخصات محصول، تعداد و مقصد) ممکن است با تأمین‌کنندگان تأییدشده، همکاران لجستیک یا کارگزاران گمرکی درگیر در همان درخواست مشخص به اشتراک گذاشته شود. ما اطلاعات تماس شما را فراتر از آنچه برای اجرای درخواست لازم است، به اشتراک نمی‌گذاریم.</p>

          <h2>نگهداری داده‌ها</h2>
          <p>ما اطلاعات ثبت‌شده‌ی نیازمندی و تماس را تا زمانی که برای انجام درخواست و نگهداری سوابق برای اهداف تجاری، قانونی و حسابداری مشروع لازم باشد، نگه می‌داریم.</p>

          <h2>حقوق شما</h2>
          <p>می‌توانید با استفاده از اطلاعات تماس زیر، درخواست دسترسی، اصلاح یا حذف اطلاعات شخصی‌ای که درباره‌ی شما نزد ما نگهداری می‌شود را مطرح کنید.</p>

          <h2>تماس</h2>
          <p>سوالات درباره‌ی این سیاست حریم خصوصی را می‌توانید به <a href="mailto:hello@renasxgroup.com">hello@renasxgroup.com</a> ارسال کنید.</p>
        `,
      },
    },
  ], "fa");

  // --- Journal entries, published so /blog reads as a real index rather
  // than a single-item listing.
  const p = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });
  const h = (text: string) => ({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] });
  const quote = (text: string) => ({ type: "blockquote", content: [p(text)] });

  async function publishPost(
    title: string,
    slug: string,
    excerpt: string,
    publishedAt: Date,
    blocks: Array<Record<string, unknown>>,
    locale: "en" | "fa" = "en",
  ) {
    const content = { type: "doc", content: blocks };
    const existing = await prisma.blogPost.findUnique({ where: { slug_locale: { slug, locale } } });
    const record =
      existing ?? (await prisma.blogPost.create({ data: { title, slug, locale, excerpt, content, status: "DRAFT" } }));

    await prisma.blogPost.update({
      where: { id: record.id },
      data: {
        title,
        excerpt,
        content,
        status: "PUBLISHED",
        publishedAt,
        publishedSnapshot: {
          title,
          slug,
          excerpt,
          content,
          coverImageId: null,
          authorId: null,
          categoryIds: [],
          tagIds: [],
          seo: null,
        },
      },
    });
    console.log(`Seeded blog post "${title}" [${locale}] (id: ${record.id}, status: PUBLISHED)`);
  }

  await publishPost(
    "What Industrial Supply Intelligence Actually Means",
    "industrial-supply-intelligence",
    "A precise requirement creates a better sourcing process — here's what that looks like in practice.",
    new Date("2026-08-26T09:00:00Z"),
    [
      p("Most sourcing problems are traced back to the same root cause: the requirement was never actually precise enough to source against in the first place."),
      h("A name is not a specification"),
      p("A part name or a photo tells a supplier what a buyer thinks they need. It rarely tells them what will actually fit, perform and clear customs at the destination. Translating a stated requirement into a sourceable, verifiable specification is the first real step in any supply process — before market and pricing conversations start."),
      h("Verification happens before commitment, not after"),
      p("A competitive quotation means very little if the supplier cannot actually deliver against the specification, the timeline or the required documentation. Supplier capability, product alignment and commercial terms have to be assessed together — not sequentially, and not after a commercial commitment has already been made."),
      quote("The outcome of a sourcing process is not a supplier introduction. The outcome is delivered supply."),
      h("Route and documentation are part of the decision, not an afterthought"),
      p("The cheapest quotation is irrelevant if the execution path behind it does not work — if the route, the documentation or the logistics cannot support the commercial terms that were agreed. Treating price, fit, route, timing and risk as one connected decision, rather than five separate ones, is what actually determines whether a supply chain performs."),
    ],
  );

  await publishPost(
    "هوشمندی تأمین صنعتی واقعاً یعنی چه",
    "industrial-supply-intelligence",
    "یک نیازمندی دقیق، فرآیند تأمین بهتری می‌سازد — این در عمل چه شکلی دارد.",
    new Date("2026-08-26T09:00:00Z"),
    [
      p("بیشتر مشکلات تأمین به یک ریشه‌ی مشترک برمی‌گردد: نیازمندی از همان ابتدا هرگز به‌اندازه‌ی کافی دقیق برای تأمین بر پایه‌ی آن نبوده است."),
      h("یک نام، یک مشخصات فنی نیست"),
      p("نام یک قطعه یا یک عکس به تأمین‌کننده می‌گوید خریدار فکر می‌کند به چه چیزی نیاز دارد. به‌ندرت می‌گوید چه چیزی واقعاً جفت‌وجور می‌شود، عمل می‌کند و در مقصد از گمرک عبور می‌کند. ترجمه‌ی یک نیازمندی اعلام‌شده به مشخصاتی قابل‌تأمین و قابل‌تأیید، اولین گام واقعی در هر فرآیند تأمین است — پیش از شروع گفتگوهای بازار و قیمت‌گذاری."),
      h("تأیید پیش از تعهد رخ می‌دهد، نه بعد از آن"),
      p("یک قیمت پیشنهادی رقابتی معنای چندانی ندارد اگر تأمین‌کننده واقعاً نتواند در برابر مشخصات فنی، زمان‌بندی یا مستندات مورد نیاز تحویل دهد. توانایی تأمین‌کننده، همخوانی محصول و شرایط تجاری باید با هم ارزیابی شوند — نه به‌ترتیب، و نه پس از ایجاد یک تعهد تجاری."),
      quote("نتیجه‌ی یک فرآیند تأمین، معرفی یک تأمین‌کننده نیست. نتیجه، تأمین تحویل‌شده است."),
      h("مسیر و مستندسازی بخشی از تصمیم هستند، نه یک فکر بعدی"),
      p("ارزان‌ترین قیمت پیشنهادی اگر مسیر اجرای پشت آن کار نکند بی‌اهمیت است — اگر مسیر، مستندسازی یا لجستیک نتواند از شرایط تجاری توافق‌شده پشتیبانی کند. دیدن قیمت، تطابق، مسیر، زمان‌بندی و ریسک به‌عنوان یک تصمیم واحد و به‌هم‌پیوسته، به‌جای پنج تصمیم جداگانه، همان چیزی است که واقعاً تعیین می‌کند یک زنجیره‌ی تأمین عملکرد دارد یا نه."),
    ],
    "fa",
  );

  await publishPost(
    "Reading a Quotation: What “Ex-Stock” Actually Means",
    "reading-a-quotation-ex-stock",
    "Ex-stock availability and an unconfirmed production slot look identical on a quotation. They are not the same commitment.",
    new Date("2026-08-11T09:00:00Z"),
    [
      p("Two quotations can carry the same unit price, the same currency and the same stated lead time, and still describe completely different commitments. The difference is whether the goods already exist."),
      h("Stock, allocated stock, and a production slot"),
      p("Ex-stock means the supplier is holding the part now. Allocated stock means it exists but is already promised to another order and may be released. A production slot means the part will be manufactured, and the quoted lead time starts from a date that has not necessarily been confirmed yet. All three are routinely quoted with the same two-word availability line."),
      h("What to ask before the terms are agreed"),
      p("Ask which warehouse the stock sits in, whether the quantity quoted is the full quantity available, and what happens to the lead time if the order is placed a week later than the quotation assumes. A supplier holding real stock answers these immediately. A supplier working from a production plan will qualify the answer — and that qualification is the information you needed."),
      quote("A lead time is a claim about the future. Availability is a claim about the present. Only one of them can be verified today."),
      h("Why this shapes the rest of the plan"),
      p("Route and documentation planning both depend on a realistic ready-to-ship date. Building a consolidation plan or booking freight against a production slot that later moves is one of the most common ways a well-priced order becomes an expensive one."),
    ],
  );

  await publishPost(
    "خواندن یک قیمت پیشنهادی: «موجود در انبار» واقعاً یعنی چه",
    "reading-a-quotation-ex-stock",
    "موجودی واقعی در انبار و یک نوبت تولید تأییدنشده، در یک قیمت پیشنهادی یکسان به نظر می‌رسند. اما یک تعهد نیستند.",
    new Date("2026-08-11T09:00:00Z"),
    [
      p("دو قیمت پیشنهادی می‌توانند قیمت واحد یکسان، ارز یکسان و زمان تحویل اعلام‌شده‌ی یکسانی داشته باشند، و همچنان دو تعهد کاملاً متفاوت را توصیف کنند. تفاوت این است که آیا کالا از قبل وجود دارد یا نه."),
      h("موجودی، موجودی رزروشده، و یک نوبت تولید"),
      p("موجود در انبار یعنی تأمین‌کننده همین حالا قطعه را نگه داشته است. موجودی رزروشده یعنی وجود دارد اما از قبل به سفارش دیگری وعده داده شده و ممکن است آزاد شود. یک نوبت تولید یعنی قطعه ساخته خواهد شد، و زمان تحویل اعلام‌شده از تاریخی شروع می‌شود که لزوماً هنوز تأیید نشده است. هر سه معمولاً با همان عبارت دوکلمه‌ای «در دسترس» قیمت‌گذاری می‌شوند."),
      h("پیش از توافق بر سر شرایط چه بپرسیم"),
      p("بپرسید موجودی در کدام انبار قرار دارد، آیا تعداد اعلام‌شده کل موجودی در دسترس است، و اگر سفارش یک هفته دیرتر از آنچه قیمت پیشنهادی فرض می‌کند ثبت شود، زمان تحویل چه می‌شود. تأمین‌کننده‌ای که موجودی واقعی دارد فوراً به این‌ها پاسخ می‌دهد. تأمین‌کننده‌ای که از یک برنامه‌ی تولید کار می‌کند، پاسخ را مشروط می‌کند — و همان مشروط‌کردن، همان اطلاعاتی است که نیاز داشتید."),
      quote("زمان تحویل، ادعایی درباره‌ی آینده است. در دسترس بودن، ادعایی درباره‌ی حال است. فقط یکی از این دو امروز قابل‌تأیید است."),
      h("چرا این باقی برنامه را شکل می‌دهد"),
      p("برنامه‌ریزی مسیر و مستندسازی هر دو به یک تاریخ واقع‌بینانه‌ی آماده‌ی ارسال وابسته‌اند. ساختن یک برنامه‌ی تجمیعی یا رزرو حمل بر اساس یک نوبت تولید که بعداً جابه‌جا می‌شود، یکی از رایج‌ترین راه‌هایی است که یک سفارش خوش‌قیمت به یک سفارش گران تبدیل می‌شود."),
    ],
    "fa",
  );

  await publishPost(
    "Why the Cheapest Origin Is Rarely the Fastest",
    "cheapest-origin-is-rarely-fastest",
    "East Asia, the Gulf and Turkey each carry a different transit profile and documentation burden. Unit price only describes one of them.",
    new Date("2026-07-27T09:00:00Z"),
    [
      p("Comparing suppliers across origins on unit price alone is comparing one variable out of four. The other three — transit time, documentation burden and consolidation opportunity — are set by where the goods start, not by what they cost."),
      h("Transit is a profile, not a number"),
      p("Sea freight from East Asia carries a long but relatively predictable transit. Overland from Turkey is shorter but exposed to border conditions that vary week to week. A Gulf origin can sit between the two. The right question is not which is fastest on paper, but which variance your operation can actually absorb."),
      h("Documentation burden differs by route"),
      p("Origin determines which certificates are required, how tariff classification is treated on arrival, and how much of the paperwork can be prepared in advance. An origin with a lower unit price and a heavier documentation requirement can easily be the more expensive option once clearance delay is counted."),
      h("Consolidation changes the arithmetic"),
      p("A single urgent part rarely justifies its own shipment. Where several requirements share an origin, consolidating them changes the per-part landed cost substantially — which sometimes makes the nominally more expensive origin the cheaper one, purely because more of the order can travel together."),
      quote("Landed cost at the destination is the only price that describes the whole decision."),
    ],
  );

  await publishPost(
    "چرا ارزان‌ترین مبدأ به‌ندرت سریع‌ترین است",
    "cheapest-origin-is-rarely-fastest",
    "شرق آسیا، خلیج فارس و ترکیه هر کدام پروفایل ترانزیت و بار مستنداتی متفاوتی دارند. قیمت واحد فقط یکی از آن‌ها را توصیف می‌کند.",
    new Date("2026-07-27T09:00:00Z"),
    [
      p("مقایسه‌ی تأمین‌کنندگان در مبادی مختلف فقط بر اساس قیمت واحد، یعنی مقایسه‌ی یک متغیر از چهار متغیر. سه متغیر دیگر — زمان ترانزیت، بار مستنداتی و فرصت تجمیعی — با محل شروع کالا تعیین می‌شوند، نه با هزینه‌ی آن‌ها."),
      h("ترانزیت یک پروفایل است، نه یک عدد"),
      p("حمل دریایی از شرق آسیا ترانزیتی طولانی اما نسبتاً قابل‌پیش‌بینی دارد. حمل زمینی از ترکیه کوتاه‌تر است اما در معرض شرایط مرزی‌ای قرار دارد که هفته به هفته تغییر می‌کند. یک مبدأ خلیج فارس می‌تواند میان این دو قرار گیرد. سؤال درست این نیست که کدام روی کاغذ سریع‌تر است، بلکه این است که عملیات شما واقعاً کدام نوسان را می‌تواند تحمل کند."),
      h("بار مستنداتی بسته به مسیر متفاوت است"),
      p("مبدأ تعیین می‌کند کدام گواهی‌ها لازم است، طبقه‌بندی تعرفه در بدو ورود چگونه برخورد می‌شود، و چه مقدار از کاغذبازی می‌تواند از پیش آماده شود. مبدأیی با قیمت واحد پایین‌تر و الزام مستنداتی سنگین‌تر، می‌تواند به‌راحتی گزینه‌ی گران‌تری باشد، وقتی تأخیر ترخیص را هم به حساب بیاورید."),
      h("تجمیع، محاسبات را تغییر می‌دهد"),
      p("یک قطعه‌ی فوری به‌تنهایی به‌ندرت توجیه‌کننده‌ی یک محموله‌ی مستقل خودش است. جایی که چند نیازمندی یک مبدأ مشترک دارند، تجمیع آن‌ها هزینه‌ی نهایی به‌ازای هر قطعه را به‌طور قابل‌توجهی تغییر می‌دهد — که گاهی مبدأیی که اسماً گران‌تر است را ارزان‌تر می‌کند، فقط چون بخش بیشتری از سفارش می‌تواند با هم حمل شود."),
      quote("هزینه‌ی نهایی در مقصد، تنها قیمتی است که کل تصمیم را توصیف می‌کند."),
    ],
    "fa",
  );

  await publishPost(
    "Cross-Referencing an OEM Part Without Losing the Specification",
    "oem-cross-reference-without-losing-spec",
    "A verified equivalent can be the right call. An equivalent chosen on a matching number alone usually is not.",
    new Date("2026-07-08T09:00:00Z"),
    [
      p("Cross-referencing is routine work in heavy-vehicle supply, and it is also where a sourcing process most often quietly goes wrong. A cross-reference table will happily return a number that fits the housing and fails the duty rating."),
      h("A matching number is a starting point"),
      p("Interchange data tells you that two parts have been catalogued as equivalent by someone, for some application. It does not tell you the operating conditions that equivalence assumed. Filtration efficiency, pressure rating, temperature range and expected service interval all sit behind the number rather than in it."),
      h("Duty rating is the specification that gets dropped"),
      p("The most common failure is substituting a part rated for lighter duty because it is dimensionally identical and materially cheaper. It fits, it installs, and it fails early under the load the vehicle actually carries — usually somewhere less convenient than the workshop it was fitted in."),
      h("How the decision should be presented"),
      p("Where a verified equivalent exists, it should be offered alongside the OEM option with the trade-off stated plainly: what is the same, what is different, and under what conditions the difference matters. The choice belongs to the operator who knows the duty cycle — but it can only be made if the difference was surfaced rather than absorbed into a single line item."),
      quote("An equivalent is a decision to be presented, not a substitution to be made silently."),
    ],
  );

  await publishPost(
    "مرجع‌گیری متقابل یک قطعه‌ی اورجینال بدون از دست دادن مشخصات فنی",
    "oem-cross-reference-without-losing-spec",
    "یک معادل تأییدشده می‌تواند انتخاب درستی باشد. معادلی که فقط بر اساس تطابق شماره انتخاب شده، معمولاً نیست.",
    new Date("2026-07-08T09:00:00Z"),
    [
      p("مرجع‌گیری متقابل کاری روتین در تأمین خودرو سنگین است، و همچنین جایی است که یک فرآیند تأمین بیشتر اوقات به‌آرامی به مشکل می‌خورد. یک جدول مرجع متقابل با کمال میل شماره‌ای برمی‌گرداند که در محفظه جا می‌شود اما در رتبه‌ی دوام شکست می‌خورد."),
      h("یک شماره‌ی مطابق، فقط یک نقطه‌ی شروع است"),
      p("داده‌های تعویض‌پذیری به شما می‌گوید دو قطعه توسط کسی، برای یک کاربرد مشخص، معادل کاتالوگ شده‌اند. به شما نمی‌گوید آن معادل‌بودن چه شرایط عملیاتی‌ای را فرض گرفته است. راندمان فیلتراسیون، رتبه‌ی فشار، بازه‌ی دما و بازه‌ی سرویس مورد انتظار، همه پشت آن شماره قرار دارند، نه درون آن."),
      h("رتبه‌ی دوام، مشخصه‌ای است که کنار گذاشته می‌شود"),
      p("رایج‌ترین شکست، جایگزینی یک قطعه با رتبه‌ی سبک‌تر است چون از نظر ابعادی یکسان و از نظر قیمت ارزان‌تر است. جا می‌شود، نصب می‌شود، و زودتر تحت باری که خودرو واقعاً حمل می‌کند شکست می‌خورد — معمولاً جایی کمتر مناسب از کارگاهی که در آن نصب شده بود."),
      h("این تصمیم چگونه باید ارائه شود"),
      p("جایی که یک معادل تأییدشده وجود دارد، باید در کنار گزینه‌ی اورجینال و با بیان صریح تفاوت‌ها ارائه شود: چه چیزی یکسان است، چه چیزی متفاوت است، و در چه شرایطی آن تفاوت اهمیت دارد. انتخاب متعلق به اپراتوری است که چرخه‌ی کاری را می‌شناسد — اما فقط زمانی می‌تواند انجام شود که تفاوت آشکار شده باشد، نه اینکه در یک ردیف واحد جذب شده باشد."),
      quote("یک معادل، تصمیمی است که باید ارائه شود، نه جایگزینی که باید در سکوت انجام شود."),
    ],
    "fa",
  );

  await publishPost(
    "Documentation Is Planned, Not Assembled",
    "documentation-is-planned-not-assembled",
    "Discovering a paperwork gap at the border is the most expensive possible moment to discover it.",
    new Date("2026-06-17T09:00:00Z"),
    [
      p("Documentation is often treated as the administrative tail of a shipment — something assembled once the commercial terms are settled and the goods are moving. Treated that way, it becomes the single most reliable source of delay in regional trade."),
      h("The documents decide the route as much as the route decides the documents"),
      p("Tariff classification, origin evidence and conformity requirements are not consequences of a routing decision; they are inputs to it. A route that is faster on a map and heavier on paperwork can arrive later than the slower one, and there is no way to know which is which until both are examined together."),
      h("Errors are cheap early and expensive late"),
      p("A misclassified HS code corrected during planning costs an email. The same error corrected at the border costs demurrage, storage and a renegotiated delivery date — and the correction still has to happen. The work is identical; only the price of doing it has changed."),
      quote("Every document a shipment needs is knowable before the shipment moves. The only variable is whether anyone worked it out in time."),
      h("What planning it properly looks like"),
      p("Before terms are confirmed, the destination's requirements are established, the classification is agreed, and the responsibility for each document is assigned to a named party. None of this is complicated. It is simply work that has to happen at the start, when it is still cheap, rather than at the border, when it is not."),
    ],
  );

  await publishPost(
    "مستندسازی برنامه‌ریزی می‌شود، نه جمع‌آوری",
    "documentation-is-planned-not-assembled",
    "کشف یک خلأ در مدارک در مرز، گران‌ترین لحظه‌ی ممکن برای کشف آن است.",
    new Date("2026-06-17T09:00:00Z"),
    [
      p("مستندسازی اغلب به‌عنوان دنباله‌ی اداری یک محموله در نظر گرفته می‌شود — چیزی که پس از قطعی‌شدن شرایط تجاری و حرکت کالا جمع‌آوری می‌شود. با این نگاه، به قابل‌اعتمادترین منبع تأخیر در تجارت منطقه‌ای تبدیل می‌شود."),
      h("اسناد به همان اندازه مسیر را تعیین می‌کنند که مسیر اسناد را"),
      p("طبقه‌بندی تعرفه، مدارک مبدأ و الزامات انطباق، پیامد یک تصمیم مسیریابی نیستند؛ ورودی آن هستند. مسیری که روی نقشه سریع‌تر است و کاغذبازی سنگین‌تری دارد، می‌تواند دیرتر از مسیر کندتر برسد، و راهی برای دانستن اینکه کدام‌یک است وجود ندارد تا زمانی که هر دو با هم بررسی شوند."),
      h("خطاها در ابتدا ارزان و در انتها گران هستند"),
      p("یک کد HS اشتباه که در مرحله‌ی برنامه‌ریزی اصلاح شود، هزینه‌ی یک ایمیل دارد. همان خطا اگر در مرز اصلاح شود، هزینه‌ی دموراژ، انبارداری و یک تاریخ تحویل مجدداً مذاکره‌شده دارد — و اصلاح همچنان باید انجام شود. کار یکسان است؛ فقط قیمت انجام آن تغییر کرده است."),
      quote("هر مدرکی که یک محموله نیاز دارد، پیش از حرکت محموله قابل‌شناخت است. تنها متغیر این است که آیا کسی به‌موقع آن را مشخص کرده یا نه."),
      h("برنامه‌ریزی درست چه شکلی دارد"),
      p("پیش از تأیید شرایط، الزامات مقصد مشخص می‌شود، طبقه‌بندی توافق می‌شود، و مسئولیت هر مدرک به یک طرف مشخص واگذار می‌شود. هیچ‌کدام از این‌ها پیچیده نیست. این فقط کاری است که باید در ابتدا، وقتی هنوز ارزان است، انجام شود، نه در مرز، وقتی که دیگر نیست."),
    ],
    "fa",
  );

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
