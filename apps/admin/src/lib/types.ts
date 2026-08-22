export type Role = "SUPER_ADMIN" | "EDITOR";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: "ACTIVE" | "DISABLED";
  lastLoginAt: string | null;
}

export type PageStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface AdminPageSection {
  id: string;
  pageId: string;
  type: string;
  position: number;
  content: unknown;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPage {
  id: string;
  title: string;
  slug: string;
  locale: string;
  status: PageStatus;
  publishedAt: string | null;
  publishedSnapshot: unknown;
  createdAt: string;
  updatedAt: string;
  sections: AdminPageSection[];
  seoMetadata: AdminSeo | null;
}

export interface AdminSeo {
  id: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageId: string | null;
}

export interface Revision {
  id: string;
  entityType: string;
  entityId: string;
  version: number;
  snapshot: unknown;
  editorId: string | null;
  createdAt: string;
  editor: { id: string; name: string; email: string } | null;
}

export type BlogPostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: unknown;
  coverImageId: string | null;
  coverImage: MediaAsset | null;
  authorId: string | null;
  author: { id: string; name: string } | null;
  status: BlogPostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categories: Array<{ category: { id: string; name: string; slug: string } }>;
  tags: Array<{ tag: { id: string; name: string; slug: string } }>;
  seoMetadata: AdminSeo | null;
}

export interface MediaAsset {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  storageKey: string;
  publicUrl: string;
  alt: string | null;
  caption: string | null;
  createdAt: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  url: string;
  isExternal: boolean;
  target: string;
  position: number;
  isVisible: boolean;
}

export interface SiteSettings {
  id: string;
  companyName: string;
  defaultSeoTitle: string | null;
  defaultSeoDescription: string | null;
  logoMediaId: string | null;
  faviconMediaId: string | null;
  contactEmail: string | null;
  phone: string | null;
  whatsapp: string | null;
  linkedin: string | null;
  officeAddress: string | null;
  footerText: string | null;
  socialLinks: Record<string, string> | null;
  defaultOgImageId: string | null;
}

export interface SupplyRequestNote {
  id: string;
  note: string;
  createdAt: string;
  author: { id: string; name: string } | null;
}

export interface SupplyRequest {
  id: string;
  productName: string;
  brand: string | null;
  partNumber: string | null;
  quantity: string | null;
  unit: string | null;
  category: string | null;
  originPreference: string | null;
  destination: string | null;
  requiredBy: string | null;
  attachmentMediaId: string | null;
  attachment: MediaAsset | null;
  contactName: string;
  companyName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactChannel: string | null;
  message: string | null;
  source: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  referrer: string | null;
  status: "NEW" | "REVIEWING" | "CONTACTED" | "QUALIFIED" | "CLOSED" | "SPAM";
  createdAt: string;
  notes: SupplyRequestNote[];
}

export interface ContactSubmission {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: "NEW" | "HANDLED" | "SPAM";
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  user: { id: string; name: string; email: string } | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface Redirect {
  id: string;
  sourcePath: string;
  destinationPath: string;
  statusCode: 301 | 302;
  isActive: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  publishedPages: number;
  draftPages: number;
  publishedPosts: number;
  draftPosts: number;
  newSupplyRequests: number;
  recentContactSubmissions: ContactSubmission[];
  recentActivity: AuditLogEntry[];
}
