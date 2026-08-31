import { z } from "zod";

export const updateSiteSettingsSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  companyNameFa: z.string().max(200).optional(),
  defaultSeoTitle: z.string().max(300).optional(),
  defaultSeoTitleFa: z.string().max(300).optional(),
  defaultSeoDescription: z.string().max(500).optional(),
  defaultSeoDescriptionFa: z.string().max(500).optional(),
  logoMediaId: z.string().uuid().nullable().optional(),
  faviconMediaId: z.string().uuid().nullable().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  whatsapp: z.string().max(50).optional(),
  linkedin: z.string().max(300).optional(),
  officeAddress: z.string().max(500).optional(),
  officeAddressFa: z.string().max(500).optional(),
  footerText: z.string().max(1000).optional(),
  footerTextFa: z.string().max(1000).optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  defaultOgImageId: z.string().uuid().nullable().optional(),
});
export type UpdateSiteSettingsInput = z.infer<typeof updateSiteSettingsSchema>;

export const navigationItemInputSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(200),
  url: z.string().min(1).max(500),
  isExternal: z.boolean().optional().default(false),
  target: z.enum(["_self", "_blank"]).optional().default("_self"),
  isVisible: z.boolean().optional().default(true),
});

export const updateNavigationSchema = z.object({
  items: z.array(navigationItemInputSchema).max(50),
});
export type UpdateNavigationInput = z.infer<typeof updateNavigationSchema>;

export const createRedirectSchema = z.object({
  sourcePath: z.string().min(1).max(500),
  destinationPath: z.string().min(1).max(500),
  statusCode: z.union([z.literal(301), z.literal(302)]).default(301),
  isActive: z.boolean().optional().default(true),
});
export type CreateRedirectInput = z.infer<typeof createRedirectSchema>;
