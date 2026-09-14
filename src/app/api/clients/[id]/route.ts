import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// [GET] /api/clients/[id] - Busca um cliente específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const client = await prisma.client.findUnique({
      where: { id, lojaId: user.lojaId },
      include: { address: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cliente." },
      { status: 500 },
    );
  }
}

// [PATCH] /api/clients/[id] - Atualiza um cliente e seu endereço
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, phone, email, notes, address } = body;

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    // Validate that client belongs to user's loja before updating
    const existingClient = await prisma.client.findUnique({ where: { id, lojaId: user.lojaId } });
    if (!existingClient) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name,
        phone,
        email,
        notes,
        // Como o relacionamento é de lista (to-many), usamos deleteMany + create
        // para substituir o endereço antigo pelo novo com segurança.
        address: address
          ? {
              deleteMany: {},
              create: {
                street: address.street || "",
                number: address.number || "",
                complement: address.complement || "",
                neighborhood: address.neighborhood || "",
                city: address.city || "",
                state: address.state || "",
                zipCode: address.zipCode || "",
                lojaId: user.lojaId,
              },
            }
          : undefined,
      },
      include: {
        address: true,
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar cliente." },
      { status: 500 },
    );
  }
}

// [DELETE] /api/clients/[id] - Remove um cliente
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    // Validate that client belongs to user's loja before deleting
    const existingClient = await prisma.client.findUnique({ where: { id, lojaId: user.lojaId } });
    if (!existingClient) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

    // Remove os endereços vinculados antes de apagar o cliente
    await prisma.address
      .deleteMany({
        where: { clientId: id, lojaId: user.lojaId },
      })
      .catch(() => {});

    await prisma.client.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Erro ao deletar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao deletar cliente." },
      { status: 500 },
    );
  }
}
