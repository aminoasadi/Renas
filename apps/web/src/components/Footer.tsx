import { getNavigation, getSettings } from "@/lib/api";
import { WhatsAppLink } from "./WhatsAppLink";
import type { Locale } from "@/lib/i18n";

export async function Footer({ locale }: { locale: Locale }) {
  const [nav, settings] = await Promise.all([getNavigation("FOOTER", locale), getSettings()]);
  const isFa = locale === "fa";
  const companyName = isFa && settings.companyNameFa ? settings.companyNameFa : settings.companyName;
  const footerText = isFa ? (settings.footerTextFa ?? settings.footerText) : settings.footerText;
  const officeAddress = isFa ? (settings.officeAddressFa ?? settings.officeAddress) : settings.officeAddress;
  const labels = isFa
    ? { email: "ایمیل", phone: "تلفن", whatsapp: "واتس‌اپ", linkedin: "لینکدین", privacy: "حریم خصوصی" }
    : { email: "EMAIL", phone: "PHONE", whatsapp: "WHATSAPP", linkedin: "LINKEDIN", privacy: "PRIVACY" };

  return (
    <footer className="m-footer" id="contact" aria-label="Footer" data-theme-bg="charcoal">
      <div className="container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/renas-mark.png" alt="" className="m-footer__mark" />
        {footerText && <p className="m-footer__tagline">{footerText}</p>}
        <h2 className="m-footer__wordmark">{companyName}</h2>
        <div className="m-footer__gold-rule" aria-hidden="true" />

        <div className="m-footer__grid">
          <nav className="m-footer__nav" aria-label="Footer navigation">
            {nav.items.map((item) => (
              <a key={item.id} href={item.isExternal ? item.url : `/${locale}${item.url}`}>
                {isFa ? item.label : item.label.toUpperCase()}
              </a>
            ))}
          </nav>

          <div className="m-footer__contact">
            {settings.contactEmail && (
              <>
                <p className="meta">{labels.email}</p>
                <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
              </>
            )}
            {settings.phone && (
              <>
                <p className="meta">{labels.phone}</p>
                <a href={`tel:${settings.phone}`}>{settings.phone}</a>
              </>
            )}
            {settings.whatsapp && (
              <>
                <p className="meta">{labels.whatsapp}</p>
                <WhatsAppLink number={settings.whatsapp} />
              </>
            )}
            {settings.linkedin && (
              <>
                <p className="meta">{labels.linkedin}</p>
                <a href={settings.linkedin} target="_blank" rel="noopener noreferrer">
                  {settings.linkedin.replace(/^https?:\/\//, "")}
                </a>
              </>
            )}
          </div>

          <div className="m-footer__meta">
            {officeAddress && <span>{officeAddress}</span>}
          </div>
        </div>

        <div className="m-footer__bottom">
          <span>&copy; {new Date().getFullYear()} {companyName.toUpperCase()}</span>
          <a href={`/${locale}/privacy`}>{labels.privacy}</a>
        </div>
      </div>
    </footer>
  );
}
