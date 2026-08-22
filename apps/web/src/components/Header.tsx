import { getNavigation, getSettings } from "@/lib/api";
import { RequestSupplyCta } from "./RequestSupplyCta";

export async function Header() {
  const [nav, settings] = await Promise.all([getNavigation("HEADER"), getSettings()]);

  return (
    <>
      <header className="m-header" id="mHeader" data-theme="transparent">
        <div className="container m-header__inner">
          <a href="/" className="m-wordmark">
            {settings.companyName.split(" ")[0]}
            <span className="dot">.</span>
          </a>
          <nav className="m-nav" aria-label="Primary">
            {nav.items.map((item) => (
              <a key={item.id} href={item.url} target={item.isExternal ? "_blank" : undefined} rel={item.isExternal ? "noopener noreferrer" : undefined}>
                <span className="m-nav__rule" />
                {item.label.toUpperCase()}
              </a>
            ))}
          </nav>
          <div className="m-header__cta">
            <RequestSupplyCta className="btn btn--primary">
              REQUEST SUPPLY <span className="arrow">↗</span>
            </RequestSupplyCta>
            <button className="nav-toggle" id="mNavToggle" aria-expanded="false" aria-controls="mMobileNav" aria-label="Open menu">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      <nav className="m-mobile-nav" id="mMobileNav" aria-label="Mobile">
        {nav.items.map((item) => (
          <a key={item.id} href={item.url}>
            {item.label.toUpperCase()}
          </a>
        ))}
        <RequestSupplyCta className="btn btn--primary">
          REQUEST SUPPLY <span className="arrow">↗</span>
        </RequestSupplyCta>
      </nav>
    </>
  );
}
