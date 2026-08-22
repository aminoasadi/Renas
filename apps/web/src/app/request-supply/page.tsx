import type { Metadata } from "next";
import { RequestSupplyForm } from "@/components/RequestSupplyForm";
import { generatePageMetadata } from "@/lib/page-metadata";
import { CmsPage } from "@/components/CmsPage";
import { getPage, NotFoundError } from "@/lib/api";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata("request-supply", "/request-supply");
}

async function hasCmsPage(): Promise<boolean> {
  try {
    await getPage("request-supply");
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) return false;
    throw error;
  }
}

export default async function RequestSupplyPage() {
  const hasCms = await hasCmsPage();
  return (
    <>
      {hasCms && <CmsPage slug="request-supply" />}
      <RequestSupplyForm />
    </>
  );
}
