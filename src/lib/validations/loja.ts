import { z } from "zod";

export const lojaSchema = z.object({
  name: z.string().min(1, "O nome da loja é obrigatório"),
  ownerName: z.string().min(1, "O nome do responsável é obrigatório"),
  phone: z.string().optional().nullable(),
  email: z
    .string()
    .email("Formato de e-mail inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
  document: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export type LojaFormData = z.infer<typeof lojaSchema>;
