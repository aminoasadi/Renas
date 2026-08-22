import Script from "next/script";
import { config } from "@/lib/config";

/**
 * Renders nothing (no script tags at all) unless the corresponding env var
 * is actually set — analytics services never initialize in local/dev
 * environments by accident, per the platform's requirement that services
 * only turn on when explicitly configured.
 */
export function Analytics() {
  return (
    <>
      {config.gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${config.gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${config.gaId}');
              window.gtag = gtag;`}
          </Script>
        </>
      )}
      {config.clarityId && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${config.clarityId}");`}
        </Script>
      )}
    </>
  );
}
