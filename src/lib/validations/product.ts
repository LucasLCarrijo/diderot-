import { z } from "zod";

// Categories available for products
export const PRODUCT_CATEGORIES = [
  "Moda",
  "Beleza",
  "Tecnologia",
  "Casa",
  "Esportes",
  "Saúde",
  "Livros",
  "Games",
  "Pet",
  "Kids",
  "Viagem",
  "Gastronomia",
  "Outros",
] as const;

export const MONETIZATION_TYPES = [
  { value: "affiliate", label: "Link de Afiliado", description: "Ganhe comissão por cada venda" },
  { value: "coupon", label: "Cupom de Desconto", description: "Ofereça desconto exclusivo" },
  { value: "recommendation", label: "Recomendação", description: "Apenas indicação, sem monetização" },
] as const;

// Step 1: Basic info
export const productBasicSchema = z.object({
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(100, "Máximo 100 caracteres"),
  store: z
    .string()
    .min(1, "Loja/marca é obrigatória")
    .max(100, "Máximo 100 caracteres"),
  categories: z
    .array(z.string())
    .min(1, "Selecione pelo menos uma categoria"),
  monetization_type: z.enum(["affiliate", "coupon", "recommendation"]),
});

// Step 2: Monetization
export const productMonetizationSchema = z.object({
  affiliate_url: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal("")),
  coupon_code: z
    .string()
    .max(50, "Máximo 50 caracteres")
    .optional(),
  price: z.coerce.number().min(0, "Preço deve ser positivo").optional(),
  currency: z.string().default("BRL"),
  description: z
    .string()
    .max(1000, "Máximo 1000 caracteres")
    .optional(),
});

// Step 3: Images (handled separately by uploader)
export const productImagesSchema = z.object({
  image_url: z.string().url().optional().or(z.literal("")),
  additional_images: z.array(z.string().url()).max(5).default([]),
});

// Combined schema for full product
export const productSchema = productBasicSchema
  .merge(productMonetizationSchema)
  .merge(productImagesSchema)
  .extend({
    is_published: z.boolean().default(true),
    status: z.enum(["published", "draft", "archived"]).default("published"),
  })
  .refine(
    (data) => {
      // URL is required for affiliate and coupon types
      if (data.monetization_type !== "recommendation") {
        return !!data.affiliate_url && data.affiliate_url.length > 0;
      }
      return true;
    },
    {
      message: "URL de afiliado é obrigatória para este tipo de monetização",
      path: ["affiliate_url"],
    }
  );

export type ProductBasicData = z.infer<typeof productBasicSchema>;
export type ProductMonetizationData = z.infer<typeof productMonetizationSchema>;
export type ProductImagesData = z.infer<typeof productImagesSchema>;
export type ProductData = z.infer<typeof productSchema>;
