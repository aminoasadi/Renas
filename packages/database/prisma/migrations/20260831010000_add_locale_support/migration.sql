-- BlogPost: drop the global-unique slug, add locale, make (slug, locale) unique
DROP INDEX "BlogPost_slug_key";
ALTER TABLE "BlogPost" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
CREATE UNIQUE INDEX "BlogPost_slug_locale_key" ON "BlogPost"("slug", "locale");

-- NavigationItem: add locale, replace the position index to include it
ALTER TABLE "NavigationItem" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
DROP INDEX "NavigationItem_navigationId_position_idx";
CREATE INDEX "NavigationItem_navigationId_locale_position_idx" ON "NavigationItem"("navigationId", "locale", "position");

-- FaqItem: add locale, replace the position index to include it
ALTER TABLE "FaqItem" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
DROP INDEX "FaqItem_position_idx";
CREATE INDEX "FaqItem_locale_position_idx" ON "FaqItem"("locale", "position");

-- SiteSettings: nullable Persian counterparts for translatable strings
ALTER TABLE "SiteSettings" ADD COLUMN "companyNameFa" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "defaultSeoTitleFa" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "defaultSeoDescriptionFa" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "officeAddressFa" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "footerTextFa" TEXT;
