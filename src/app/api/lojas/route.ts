import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Busca a primeira loja cadastrada (ideal para configurações globais)
    const loja = await prisma.loja.findFirst();

    if (!loja) {
      return NextResponse.json(
        { error: "Loja não encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json(loja);
  } catch (error) {
    console.error("Erro ao buscar loja:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const loja = await prisma.loja.create({
      data: {
        ...body,
        accessGroups: {
          create: {
            name: "ADMIN",
            description: "Acesso total ao sistema",
            permissions: {
              "clientes": [
                "Visualizar",
                "Adicionar",
                "Editar",
                "Excluir"
              ],
              "produtos": [
                "Visualizar",
                "Adicionar",
                "Editar",
                "Excluir"
              ],
              "dashboard": [
                "Visualizar"
              ],
              "historico": [
                "Visualizar",
                "Editar",
                "Excluir"
              ],
              "nova-venda": [
                "Visualizar",
                "Adicionar"
              ]
            }
          }
        }
      },
    });

    return NextResponse.json(loja);
  } catch (error) {
    console.error("Erro ao criar loja:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao criar loja." },
      { status: 500 },
    );
  }
}
