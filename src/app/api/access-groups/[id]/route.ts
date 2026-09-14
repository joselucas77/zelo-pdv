import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, active, permissions } = body;

    const group = await prisma.accessGroup.update({
      where: { id },
      data: {
        name,
        description,
        active,
        permissions,
      },
    });

    return NextResponse.json(group);
  } catch (error: any) {
    // Exibe o erro real no terminal do Next.js para análise
    console.error("--> ERRO DETALHADO NO PATCH:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um grupo com este nome." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Erro desconhecido ao atualizar grupo." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const usersCount = await prisma.user.count({
      where: { groupId: id },
    });

    if (usersCount > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir um grupo que possui usuários vinculados.",
        },
        { status: 400 },
      );
    }

    await prisma.accessGroup.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao excluir grupo." },
      { status: 500 },
    );
  }
}
