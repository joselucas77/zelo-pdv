import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const resolvedParams = await params;
    const body = await req.json();
    const { name, abbreviation, decimalPlaces } = body;

    const unit = await prisma.unit.updateMany({
      where: { id: resolvedParams.id, lojaId: user.lojaId },
      data: { name, abbreviation, decimalPlaces },
    });

    if (unit.count === 0) {
      return NextResponse.json(
        { error: "Unidade não encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe uma unidade com este nome ou abreviação." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const resolvedParams = await params;
    const unit = await prisma.unit.deleteMany({
      where: { id: resolvedParams.id, lojaId: user.lojaId },
    });

    if (unit.count === 0) {
      return NextResponse.json(
        { error: "Unidade não encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
