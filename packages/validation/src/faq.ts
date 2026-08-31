import { z } from "zod";

export const faqItemInputSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(3000),
  isVisible: z.boolean().optional().default(true),
});

export const updateFaqItemsSchema = z.object({
  items: z.array(faqItemInputSchema).max(200),
});
export type UpdateFaqItemsInput = z.infer<typeof updateFaqItemsSchema>;
