import { NextResponse, type NextRequest } from "next/server";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/i18n";

function hasLocalePrefix(pathname: string) {
  return SUPPORTED_LOCALES.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proxies the browser's same-origin form-submission calls to the real
  // API, resolving API_URL fresh on every request (plain server env var,
  // read at runtime) rather than baking a destination into
  // next.config.mjs's rewrites(), which next build freezes into
  // routes-manifest.json at build time — see client-config.ts for why
  // same-origin matters in the first place.
  if (pathname.startsWith("/api/v1/public/")) {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      return new NextResponse("API_URL is not configured", { status: 500 });
    }
    return NextResponse.rewrite(new URL(pathname + request.nextUrl.search, apiUrl));
  }

  // Next.js internals, API routes and static files are never locale-prefixed.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (hasLocalePrefix(pathname)) {
    return NextResponse.next();
  }

  // No locale in the URL — redirect to the default locale rather than
  // guessing from Accept-Language, so a bookmarked/shared link always
  // resolves the same way regardless of the visitor's browser settings.
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
