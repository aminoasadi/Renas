import type { Metadata } from "next";
import { RequestSupplyForm } from "@/components/RequestSupplyForm";
import { generatePageMetadata } from "@/lib/page-metadata";
import { CmsPage } from "@/components/CmsPage";
import { getPage, NotFoundError } from "@/lib/api";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  return generatePageMetadata("request-supply", "/request-supply", locale);
}

async function hasCmsPage(locale: Locale): Promise<boolean> {
  try {
    await getPage("request-supply", locale);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) return false;
    throw error;
  }
}

export default async function RequestSupplyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const hasCms = await hasCmsPage(locale);
  return (
    <>
      {hasCms && <CmsPage slug="request-supply" locale={locale} />}
      <RequestSupplyForm locale={locale} />
    </>
  );
}
