import type { Metadata } from "next";
import { listFaqItems } from "@/lib/api";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

const COPY = {
  en: {
    title: "FAQ",
    description: "Answers to common questions about sourcing, verification, documentation and delivery with RENAS.",
    eyebrow: "FAQ",
    headline: "Questions we hear before a requirement is submitted.",
    intro: "Answers drawn from how RENAS actually operates — sourcing, verification, documentation, routing and delivery. If your question isn’t here, ",
    contactLink: "get in touch",
    introEnd: " directly.",
    empty: "No questions published yet.",
  },
  fa: {
    title: "سوالات متداول",
    description: "پاسخ به سوالات رایج درباره تأمین، تأیید، مستندسازی و تحویل با رناس.",
    eyebrow: "سوالات متداول",
    headline: "سوالاتی که پیش از ثبت درخواست می‌شنویم.",
    intro: "پاسخ‌هایی برگرفته از نحوه‌ی واقعی فعالیت رناس — تأمین، تأیید، مستندسازی، مسیریابی و تحویل. اگر سوال شما اینجا نیست، ",
    contactLink: "با ما در ارتباط باشید",
    introEnd: ".",
    empty: "هنوز سوالی منتشر نشده است.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = COPY[locale];
  return { title: t.title, description: t.description };
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = COPY[locale];
  const items = await listFaqItems(locale);

  return (
    <section className="section section--cream" data-theme-bg="cream">
      <div className="container">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="headline" style={{ fontSize: "var(--fs-display)", margin: "var(--sp-4) 0 var(--sp-4)", maxWidth: "18ch" }}>
          {t.headline}
        </h1>
        <p className="body-lg" style={{ maxWidth: "62ch", marginBottom: "var(--sp-9)" }}>
          {t.intro}
          <a href={`/${locale}/contact`}>{t.contactLink}</a>
          {t.introEnd}
        </p>

        {items.length === 0 && <p className="body-lg">{t.empty}</p>}

        <div>
          {items.map((item) => (
            <details key={item.id} style={{ borderTop: "var(--border-thin) solid var(--rule-on-cream)", paddingBlock: "var(--sp-5)" }}>
              <summary style={{ cursor: "pointer", fontSize: "var(--fs-h3)", fontWeight: 500 }}>{item.question}</summary>
              <p className="body-lg" style={{ marginTop: "var(--sp-3)" }}>
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
