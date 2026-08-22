import type { Metadata } from "next";
import { CmsPage } from "@/components/CmsPage";
import { generatePageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata("about", "/about");
}

export default function Page() {
  return <CmsPage slug="about" />;
}
