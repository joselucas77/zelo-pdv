import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "O nome da categoria deve ter no mínimo 2 caracteres"),
  active: z.boolean().default(true),
});

export const productSchema = z.object({
  code: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  name: z.string().min(2, "O nome do produto é obrigatório"),
  categoryId: z
    .string()
    .min(1, "Selecione uma categoria")
    .optional()
    .nullable(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  unit: z.string().default("UN"),
  costPrice: z.coerce.number().min(0, "O preço não pode ser negativo"),
  salePrice: z.coerce.number().min(0, "O preço não pode ser negativo"),
  stock: z.coerce.number().min(0, "O estoque não pode ser negativo"),
  minStock: z.coerce.number().min(0, "O estoque mínimo não pode ser negativo"),
  notes: z.string().optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
