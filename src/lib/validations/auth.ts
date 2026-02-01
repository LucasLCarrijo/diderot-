import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email é obrigatório" })
    .email({ message: "Email inválido" }),
  password: z
    .string()
    .min(1, { message: "Senha é obrigatória" }),
  rememberMe: z.boolean().optional(),
});

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Nome deve ter pelo menos 2 caracteres" })
    .max(100, { message: "Nome deve ter no máximo 100 caracteres" }),
  email: z
    .string()
    .trim()
    .min(1, { message: "Email é obrigatório" })
    .email({ message: "Email inválido" })
    .max(255, { message: "Email deve ter no máximo 255 caracteres" }),
  password: z
    .string()
    .min(8, { message: "Senha deve ter pelo menos 8 caracteres" })
    .regex(/[A-Z]/, { message: "Senha deve ter pelo menos uma letra maiúscula" })
    .regex(/[0-9]/, { message: "Senha deve ter pelo menos um número" }),
  confirmPassword: z.string(),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, { message: "Você deve aceitar os termos de uso" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email é obrigatório" })
    .email({ message: "Email inválido" }),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Senha deve ter pelo menos 8 caracteres" })
    .regex(/[A-Z]/, { message: "Senha deve ter pelo menos uma letra maiúscula" })
    .regex(/[0-9]/, { message: "Senha deve ter pelo menos um número" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
