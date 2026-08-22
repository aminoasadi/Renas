"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function BlogViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    trackEvent("blog_post_viewed", { slug });
  }, [slug]);
  return null;
}
