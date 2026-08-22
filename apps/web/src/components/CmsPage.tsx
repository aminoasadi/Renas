import { notFound } from "next/navigation";
import { SectionRenderer } from "./SectionRenderer";
import { SiteMotion } from "./SiteMotion";
import { getPage, NotFoundError } from "@/lib/api";

export async function CmsPage({ slug }: { slug: string }) {
  try {
    const page = await getPage(slug);
    return (
      <>
        <SectionRenderer sections={page.sections} />
        <SiteMotion />
      </>
    );
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
