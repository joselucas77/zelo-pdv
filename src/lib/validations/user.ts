import z from "zod";

export const userFormSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().optional(),
  phone: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  groupId: z.string().min(1, "Selecione um grupo de acesso"),
  active: z.boolean(),
});

export type UserFormData = z.infer<typeof userFormSchema>;
