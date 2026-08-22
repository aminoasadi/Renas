"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initSiteMotion } from "./site-motion";

/**
 * Mount once per page (inside each page's own tree, not the root layout) so
 * the effect re-runs with fresh DOM references every time that page's
 * content mounts. Cleanup aborts every listener `initSiteMotion` registered
 * — see that module for why an AbortController is threaded through instead
 * of tracking handlers manually.
 */
export function SiteMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const controller = new AbortController();
    initSiteMotion(controller.signal);
    return () => controller.abort();
  }, [pathname]);

  return null;
}
