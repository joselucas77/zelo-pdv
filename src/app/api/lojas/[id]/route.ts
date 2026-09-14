import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { lojaSchema } from "@/lib/validations/loja";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const body = await request.json();

    // Validação com Zod no back-end
    const parsed = lojaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos: " + parsed.error.issues[0].message },
        { status: 400 },
      );
    }
    const { id } = await params;

    const updatedLoja = await prisma.loja.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(updatedLoja);
  } catch (error) {
    console.error("Erro ao atualizar loja:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar dados." },
      { status: 500 },
    );
  }
}
