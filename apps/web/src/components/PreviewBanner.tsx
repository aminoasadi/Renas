import Link from "next/link";

export function PreviewBanner() {
  return (
    <div className="m-preview-banner">
      <span>PREVIEW MODE — you are viewing unpublished draft content</span>
      <Link href="/api/preview/exit">Exit Preview</Link>
    </div>
  );
}
