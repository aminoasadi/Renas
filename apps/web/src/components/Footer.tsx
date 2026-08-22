import { getNavigation, getSettings } from "@/lib/api";
import { WhatsAppLink } from "./WhatsAppLink";

export async function Footer() {
  const [nav, settings] = await Promise.all([getNavigation("FOOTER"), getSettings()]);

  return (
    <footer className="m-footer" id="contact" aria-label="Footer" data-theme-bg="charcoal">
      <div className="container">
        {settings.footerText && <p className="m-footer__tagline">{settings.footerText}</p>}
        <h2 className="m-footer__wordmark">{settings.companyName}</h2>
        <div className="m-footer__gold-rule" aria-hidden="true" />

        <div className="m-footer__grid">
          <nav className="m-footer__nav" aria-label="Footer navigation">
            {nav.items.map((item) => (
              <a key={item.id} href={item.url}>
                {item.label.toUpperCase()}
              </a>
            ))}
          </nav>

          <div className="m-footer__contact">
            {settings.contactEmail && (
              <>
                <p className="meta">EMAIL</p>
                <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
              </>
            )}
            {settings.phone && (
              <>
                <p className="meta">PHONE</p>
                <a href={`tel:${settings.phone}`}>{settings.phone}</a>
              </>
            )}
            {settings.whatsapp && (
              <>
                <p className="meta">WHATSAPP</p>
                <WhatsAppLink number={settings.whatsapp} />
              </>
            )}
            {settings.linkedin && (
              <>
                <p className="meta">LINKEDIN</p>
                <a href={settings.linkedin} target="_blank" rel="noopener noreferrer">
                  {settings.linkedin.replace(/^https?:\/\//, "")}
                </a>
              </>
            )}
          </div>

          <div className="m-footer__meta">
            {settings.officeAddress && <span>{settings.officeAddress}</span>}
          </div>
        </div>

        <div className="m-footer__bottom">
          <span>&copy; {new Date().getFullYear()} {settings.companyName.toUpperCase()}</span>
          <a href="/privacy">PRIVACY</a>
        </div>
      </div>
    </footer>
  );
}
