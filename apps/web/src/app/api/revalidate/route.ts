import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

/**
 * Called only by the NestJS API (server-to-server) right after a publish
 * commits — never by a browser, and never without the shared secret. This
 * is the one endpoint that can purge cache, so it's guarded accordingly:
 * an unauthenticated version of this route would let anyone force-refresh
 * (and, worse, probe) the site's cached content on demand.
 */
export async function POST(request: NextRequest) {
  const providedSecret = request.headers.get("x-revalidate-secret");
  if (providedSecret !== config.revalidateSecret) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Invalid revalidation secret" } }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const tags: unknown = body?.tags;
  if (!Array.isArray(tags) || tags.some((t) => typeof t !== "string")) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "`tags` must be an array of strings" } }, { status: 400 });
  }

  for (const tag of tags as string[]) {
    revalidateTag(tag);
  }

  return NextResponse.json({ data: { revalidated: tags } });
}
