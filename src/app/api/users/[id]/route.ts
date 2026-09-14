import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcrypt";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const updateUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.string().email("E-mail inválido").optional(),
  password: z
    .string()
    .min(6, "A senha deve ter no mínimo 6 caracteres")
    .optional()
    .or(z.literal("")),
  groupId: z.string().min(1, "Grupo é obrigatório").optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const data = updateUserSchema.parse(body);

    const updateData = { ...data };

    if (!updateData.password) {
      delete updateData.password;
    } else {
      updateData.password = await hash(updateData.password, 10);
    }

    const user = await prisma.user.update({
      where: { id, lojaId: currentUser.lojaId },
      data: updateData,
      include: { group: true },
    });

    const { password, ...safeUser } = user;

    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { id } = await params;

    const firstUser = await prisma.user.findFirst({
      where: { lojaId: currentUser.lojaId },
      orderBy: { createdAt: "asc" },
    });

    if (firstUser && firstUser.id === id) {
      return NextResponse.json({ error: "O primeiro usuário da loja não pode ser deletado." }, { status: 403 });
    }

    await prisma.user.delete({ where: { id, lojaId: currentUser.lojaId } });
    return NextResponse.json({ message: "Usuário deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao deletar usuário" },
      { status: 500 },
    );
  }
}
