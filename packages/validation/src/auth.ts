import { z } from "zod";

export const passwordLoginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});
export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>;

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  role: z.enum(["SUPER_ADMIN", "EDITOR"]),
  username: z.string().min(1).max(100),
  password: z.string().min(8).max(200),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  role: z.enum(["SUPER_ADMIN", "EDITOR"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(8).max(200),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
