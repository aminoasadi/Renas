import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

// Needs the real WEB_URL, only guaranteed once the container is actually
// running, not during the Docker build.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${config.webUrl}/sitemap.xml`,
  };
}
