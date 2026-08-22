import type { Metadata } from "next";
import { CmsPage } from "@/components/CmsPage";
import { generatePageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata("what-we-do", "/what-we-do");
}

export default function Page() {
  return <CmsPage slug="what-we-do" />;
}
