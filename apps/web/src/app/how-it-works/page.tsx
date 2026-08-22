import type { Metadata } from "next";
import { CmsPage } from "@/components/CmsPage";
import { generatePageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata("how-it-works", "/how-it-works");
}

export default function Page() {
  return <CmsPage slug="how-it-works" />;
}
