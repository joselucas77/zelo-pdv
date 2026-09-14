import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";

const userSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  groupId: z.string().min(1, "Grupo é obrigatório"),
  active: z.boolean().default(true),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const users = await prisma.user.findMany({
      where: { lojaId: user.lojaId },
      include: { group: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const body = await request.json();
    const data = userSchema.parse(body);

    const emailExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailExists) {
      return NextResponse.json(
        { error: "Já existe um usuário com este e-mail" },
        { status: 400 },
      );
    }

    const hashedPassword = await hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        groupId: data.groupId,
        active: data.active,
        lojaId: currentUser.lojaId,
      },
      include: { group: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      const message = zodError.issues?.[0]?.message ?? "Erro de validação";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}
