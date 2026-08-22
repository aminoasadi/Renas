import type { Metadata } from "next";
import { draftMode } from "next/headers";
import "../styles/globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PreviewBanner } from "@/components/PreviewBanner";
import { Analytics } from "@/components/Analytics";
import { getSettings } from "@/lib/api";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: { default: settings.defaultSeoTitle ?? settings.companyName, template: `%s — ${settings.companyName}` },
    description: settings.defaultSeoDescription ?? undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled: isPreview } = await draftMode();

  return (
    <html lang="en" dir="ltr">
      <body className="motion-page" data-header-theme="transparent">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {isPreview && <PreviewBanner />}
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <div className="m-cursor" id="mCursor" aria-hidden="true" />
        <Analytics />
      </body>
    </html>
  );
}
