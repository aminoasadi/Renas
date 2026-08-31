import { z } from "zod";

export const requestOtpSchema = z.object({
  email: z.string().email(),
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^[0-9]{4,10}$/, "OTP must be numeric"),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const passwordLoginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});
export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>;

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  role: z.enum(["SUPER_ADMIN", "EDITOR"]),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  role: z.enum(["SUPER_ADMIN", "EDITOR"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
