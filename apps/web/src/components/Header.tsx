import Link from "next/link";
import { getNavigation, getSettings } from "@/lib/api";
import { RequestSupplyCta } from "./RequestSupplyCta";
import { LocaleSwitcher } from "./LocaleSwitcher";
import type { Locale } from "@/lib/i18n";

export async function Header({ locale }: { locale: Locale }) {
  const [nav, settings] = await Promise.all([getNavigation("HEADER", locale), getSettings()]);
  const companyName = locale === "fa" && settings.companyNameFa ? settings.companyNameFa : settings.companyName;
  const requestLabel = locale === "fa" ? "درخواست تأمین" : "REQUEST SUPPLY";
  const menuLabel = locale === "fa" ? "باز کردن منو" : "Open menu";

  return (
    <>
      <header className="m-header" id="mHeader" data-theme="transparent">
        <div className="container m-header__inner">
          <Link href={`/${locale}`} className="m-wordmark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/renas-mark.png" alt="" className="m-wordmark__mark" />
            {companyName.split(" ")[0]}
            <span className="dot">.</span>
          </Link>
          <nav className="m-nav" aria-label="Primary">
            {nav.items.map((item) => (
              <a
                key={item.id}
                href={item.isExternal ? item.url : `/${locale}${item.url}`}
                target={item.isExternal ? "_blank" : undefined}
                rel={item.isExternal ? "noopener noreferrer" : undefined}
              >
                <span className="m-nav__rule" />
                {locale === "fa" ? item.label : item.label.toUpperCase()}
              </a>
            ))}
          </nav>
          <div className="m-header__cta">
            <LocaleSwitcher locale={locale} />
            <RequestSupplyCta className="btn btn--primary" locale={locale}>
              <span className="btn__label">{requestLabel}</span> <span className="arrow">↗</span>
            </RequestSupplyCta>
            <button className="nav-toggle" id="mNavToggle" aria-expanded="false" aria-controls="mMobileNav" aria-label={menuLabel}>
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      <nav className="m-mobile-nav" id="mMobileNav" aria-label="Mobile">
        {nav.items.map((item) => (
          <a key={item.id} href={item.isExternal ? item.url : `/${locale}${item.url}`}>
            {locale === "fa" ? item.label : item.label.toUpperCase()}
          </a>
        ))}
        <RequestSupplyCta className="btn btn--primary" locale={locale}>
          {requestLabel} <span className="arrow">↗</span>
        </RequestSupplyCta>
      </nav>
    </>
  );
}
