import type { Metadata } from "next";
import Script from "next/script";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import "../../styles/globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PreviewBanner } from "@/components/PreviewBanner";
import { Analytics } from "@/components/Analytics";
import { getSettings } from "@/lib/api";
import { isLocale, dirFor, type Locale } from "@/lib/i18n";

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "fa" }];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getSettings();
  const companyName = locale === "fa" && settings.companyNameFa ? settings.companyNameFa : settings.companyName;
  const title = locale === "fa" ? (settings.defaultSeoTitleFa ?? settings.defaultSeoTitle ?? companyName) : (settings.defaultSeoTitle ?? companyName);
  const description = locale === "fa" ? (settings.defaultSeoDescriptionFa ?? settings.defaultSeoDescription ?? undefined) : (settings.defaultSeoDescription ?? undefined);

  return {
    title: { default: title, template: `%s — ${companyName}` },
    description,
    alternates: {
      languages: { en: "/en", fa: "/fa" },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dir = dirFor(locale);

  const { isEnabled: isPreview } = await draftMode();

  return (
    <html lang={locale} dir={dir}>
      <body className="motion-page" data-header-theme="transparent">
        {/* This is a long single-page scroller (ScrollTrigger-driven), not a
            multi-page site — the browser's default scroll-position restore
            on refresh/back is disorienting here since every reload should
            start the hero reveal from the top, not resume mid-animation. */}
        <Script id="disable-scroll-restoration" strategy="beforeInteractive">
          {`try { if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; } window.scrollTo(0, 0); } catch (e) {}`}
        </Script>
        <a className="skip-link" href="#main">
          {locale === "fa" ? "برو به محتوا" : "Skip to content"}
        </a>
        {isPreview && <PreviewBanner />}
        <Header locale={locale} />
        <main id="main">{children}</main>
        <Footer locale={locale} />
        <div className="m-cursor" id="mCursor" aria-hidden="true" />
        <Analytics />
      </body>
    </html>
  );
}
