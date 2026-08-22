export function StatusBadge({ status, hasUnpublishedChanges }: { status: string; hasUnpublishedChanges?: boolean }) {
  if (status === "PUBLISHED" && hasUnpublishedChanges) {
    return <span className="admin-badge admin-badge--unpublished-changes">UNPUBLISHED CHANGES</span>;
  }
  const cls =
    status === "PUBLISHED" ? "admin-badge--published" : status === "ARCHIVED" ? "admin-badge--archived" : "admin-badge--draft";
  const label = status === "PUBLISHED" ? "LIVE" : status;
  return <span className={`admin-badge ${cls}`}>{label}</span>;
}
