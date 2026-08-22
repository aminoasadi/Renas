import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { generatePageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata("contact", "/contact");
}

export default function ContactPage() {
  return <ContactForm />;
}
