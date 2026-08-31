import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { getSettings } from "@/lib/api";
import { generatePageMetadata } from "@/lib/page-metadata";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

const COPY = {
  en: {
    eyebrow: "CONTACT",
    headline: "Talk to someone who works the route.",
    intro:
      "For a specific part or shipment, the supply request form gets you a faster, better-scoped answer. Use this page for everything else — partnerships, supplier introductions, or a question you would rather ask a person first.",
    email: "EMAIL",
    phone: "PHONE",
    whatsapp: "WHATSAPP",
    specificPart: "A SPECIFIC PART?",
    startRequest: "Start a supply request ↗",
    sourcing: "SOURCING / EAST ASIA · GULF · TURKEY",
    delivery: "DELIVERY / IRAN · KURDISTAN REGION · IRAQ",
  },
  fa: {
    eyebrow: "تماس با ما",
    headline: "با کسی صحبت کنید که مسیر را می‌شناسد.",
    intro:
      "برای یک قطعه یا محموله‌ی مشخص، فرم درخواست تأمین پاسخی سریع‌تر و دقیق‌تر به شما می‌دهد. از این صفحه برای هر چیز دیگری استفاده کنید — همکاری، معرفی تأمین‌کننده، یا سوالی که ترجیح می‌دهید ابتدا با یک نفر مطرح کنید.",
    email: "ایمیل",
    phone: "تلفن",
    whatsapp: "واتس‌اپ",
    specificPart: "یک قطعه‌ی مشخص دارید؟",
    startRequest: "شروع درخواست تأمین ↗",
    sourcing: "تأمین / شرق آسیا · خلیج فارس · ترکیه",
    delivery: "تحویل / ایران · اقلیم کردستان · عراق",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  return generatePageMetadata("contact", "/contact", locale);
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = COPY[locale];
  const settings = await getSettings();

  return (
    <section className="section section--cream" data-theme-bg="cream">
      <div className="container m-contact__grid">
        {/* Statement column — keeps the "why write to us" framing beside the
            form instead of leaving the page as a form on an empty field. */}
        <aside className="m-contact__aside">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="m-contact__headline headline">{t.headline}</h1>
          <p className="m-contact__intro body-lg">{t.intro}</p>

          <div className="m-contact__details">
            {settings.contactEmail && (
              <div className="m-contact__detail">
                <p className="meta">{t.email}</p>
                <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
              </div>
            )}
            {settings.phone && (
              <div className="m-contact__detail">
                <p className="meta">{t.phone}</p>
                <a href={`tel:${settings.phone}`}>{settings.phone}</a>
              </div>
            )}
            {settings.whatsapp && (
              <div className="m-contact__detail">
                <p className="meta">{t.whatsapp}</p>
                <WhatsAppLink number={settings.whatsapp} />
              </div>
            )}
            <div className="m-contact__detail">
              <p className="meta">{t.specificPart}</p>
              <a href={`/${locale}/request-supply`}>{t.startRequest}</a>
            </div>
          </div>

          <div className="m-contact__routes">
            <span>{t.sourcing}</span>
            <span>{t.delivery}</span>
          </div>
        </aside>

        <div>
          <ContactForm locale={locale} />
        </div>
      </div>
    </section>
  );
}
