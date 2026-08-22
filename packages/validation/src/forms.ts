import { z } from "zod";

/**
 * `honeypot` must arrive empty — a hidden field real users never see or
 * fill in. If it's non-empty, the submission is almost certainly a bot and
 * the caller should silently accept-and-drop it (see `docs/security.md`)
 * rather than reveal that a honeypot exists by rejecting it outright.
 */
const antiSpamFields = {
  honeypot: z.string().max(0).optional().default(""),
  turnstileToken: z.string().optional(),
};

export const supplyRequestSchema = z.object({
  productName: z.string().min(1).max(300),
  brand: z.string().max(200).optional(),
  partNumber: z.string().max(200).optional(),
  quantity: z.string().max(50).optional(),
  unit: z.string().max(50).optional(),
  category: z.string().max(200).optional(),
  originPreference: z.string().max(200).optional(),
  destination: z.string().max(200).optional(),
  requiredBy: z.string().datetime().optional(),
  attachmentMediaId: z.string().uuid().optional(),
  contactName: z.string().min(1).max(200),
  companyName: z.string().max(200).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(50).optional(),
  contactChannel: z.string().max(50).optional(),
  message: z.string().max(4000).optional(),
  source: z.string().max(100).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  ...antiSpamFields,
})
  .refine((data) => Boolean(data.contactEmail || data.contactPhone), {
    message: "Provide at least one contact method (email or phone)",
    path: ["contactEmail"],
  });
export type SupplyRequestInput = z.infer<typeof supplyRequestSchema>;

export const updateSupplyRequestStatusSchema = z.object({
  status: z.enum(["NEW", "REVIEWING", "CONTACTED", "QUALIFIED", "CLOSED", "SPAM"]),
});

export const addSupplyRequestNoteSchema = z.object({
  note: z.string().min(1).max(4000),
});

export const contactSubmissionSchema = z.object({
  name: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  subject: z.string().max(300).optional(),
  message: z.string().min(1).max(4000),
  ...antiSpamFields,
});
export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;

export const updateContactSubmissionStatusSchema = z.object({
  status: z.enum(["NEW", "HANDLED", "SPAM"]),
});
