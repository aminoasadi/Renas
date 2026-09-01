import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxies the browser's same-origin /api/v1 calls to the real API,
 * resolving API_URL fresh on every request (plain server env var, read at
 * runtime) rather than baking a destination into next.config.mjs's
 * rewrites(), which next build freezes into routes-manifest.json at build
 * time — see api-client.ts for why same-origin matters in the first place.
 */
export function middleware(request: NextRequest) {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return new NextResponse("API_URL is not configured", { status: 500 });
  }
  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, apiUrl);
  return NextResponse.rewrite(target);
}

export const config = {
  matcher: "/api/v1/:path*",
};
