import { z } from "zod";

// URL validation that only allows https:// protocol
const safeUrlSchema = z
  .string()
  .max(500, "URL deve ter no máximo 500 caracteres")
  .refine(
    (val) => {
      if (!val || val.trim() === "") return true;
      try {
        const url = new URL(val);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    },
    { message: "URL deve começar com https:// ou http://" }
  )
  .refine(
    (val) => {
      if (!val) return true;
      // Block dangerous protocols
      const dangerous = ["javascript:", "data:", "vbscript:", "file:"];
      const lowerVal = val.toLowerCase();
      return !dangerous.some((protocol) => lowerVal.startsWith(protocol));
    },
    { message: "Protocolo não permitido" }
  )
  .optional()
  .nullable();

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .refine(
      (val) => !/<[^>]*>/.test(val),
      { message: "Nome não pode conter HTML" }
    ),
  username: z
    .string()
    .min(3, "Username deve ter pelo menos 3 caracteres")
    .max(50, "Username deve ter no máximo 50 caracteres")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username pode conter apenas letras, números, _ e -"
    ),
  bio: z
    .string()
    .max(500, "Bio deve ter no máximo 500 caracteres")
    .refine(
      (val) => !val || !/<script/i.test(val),
      { message: "Bio não pode conter scripts" }
    )
    .optional()
    .nullable(),
  instagram_url: safeUrlSchema,
  tiktok_url: safeUrlSchema,
  youtube_url: safeUrlSchema,
  website_url: safeUrlSchema,
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Validate and sanitize profile data before submission
export function validateProfileData(data: Partial<ProfileFormData>): {
  success: boolean;
  data?: ProfileFormData;
  errors?: Record<string, string>;
} {
  const result = profileSchema.safeParse(data);
  
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      const field = err.path[0] as string;
      errors[field] = err.message;
    });
    return { success: false, errors };
  }
  
  return { success: true, data: result.data };
}

// Sanitize URL to prevent XSS
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === "") return null;
  
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  
  // Block dangerous protocols
  const dangerous = ["javascript:", "data:", "vbscript:", "file:"];
  if (dangerous.some((p) => lower.startsWith(p))) {
    return null;
  }
  
  // Ensure https:// or http:// prefix
  if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
    return `https://${trimmed}`;
  }
  
  return trimmed;
}
