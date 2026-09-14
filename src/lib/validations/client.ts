import { z } from "zod";

// Schema de Endereço Estruturado
export const addressSchema = z.object({
  street: z.string().min(3, "Mínimo 3 caracteres").optional().or(z.literal("")),
  number: z.string().optional().or(z.literal("")),
  complement: z.string().optional().or(z.literal("")),
  neighborhood: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "Cidade é obrigatória").optional().or(z.literal("")),
  state: z.string().min(2, "Estado é obrigatório").optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
});

// Schema Base do Cliente (Sem ID, pois será gerado pelo Prisma)
export const clientFormSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório (mínimo 2 caracteres)"),
  phone: z
    .string()
    .min(10, "Telefone inválido (mínimo 10 dígitos)")
    .or(z.literal("")),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  address: addressSchema.optional(),
  notes: z.string().optional().or(z.literal("")),
});
