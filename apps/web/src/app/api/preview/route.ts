import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { verifyPreviewToken } from "@renas/shared";
import { config } from "@/lib/config";

/**
 * Entry point for the CMS's "Preview Draft" button. The token is verified
 * here (HMAC, same secret the API signed it with — see
 * `@renas/shared/preview-token`), and only on success does draft mode turn
 * on. An invalid or expired token never enables draft mode, so there's no
 * path from "guessed a URL" to "sees unpublished content."
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return new Response("Missing preview token", { status: 400 });
  }

  const payload = verifyPreviewToken(config.previewSecret, token);
  if (!payload) {
    return new Response("Invalid or expired preview token", { status: 401 });
  }

  const draft = await draftMode();
  draft.enable();

  const destination = payload.type === "blog_post" ? `/blog/${payload.slug}` : payload.slug === "home" ? "/" : `/${payload.slug}`;
  redirect(destination);
}
