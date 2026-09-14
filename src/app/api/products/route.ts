import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { productSchema } from "@/lib/validations/product";
import { requirePermission } from "@/lib/require-permission";

export async function GET() {
  const auth = await requirePermission("produtos", "Visualizar");

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const products = await prisma.product.findMany({
      where: { lojaId: auth.user.lojaId },
      include: { category: true },
      orderBy: { name: "asc" },
    });

    const serializedProducts = products.map((product) => ({
      ...product,
      costPrice: Number(product.costPrice),
      salePrice: Number(product.salePrice),
    }));

    return NextResponse.json(serializedProducts);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);

    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requirePermission("produtos", "Adicionar");

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const data = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        ...data,
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        lojaId: auth.user.lojaId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(
      {
        ...product,
        costPrice: Number(product.costPrice),
        salePrice: Number(product.salePrice),
      },
      { status: 201 },
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos: " + error.issues[0].message },
        { status: 400 },
      );
    }
    if (error.code === "P2002" && error.meta?.target?.includes("code")) {
      return NextResponse.json(
        { error: "Já existe um produto com este código (SKU)." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Erro ao criar produto." },
      { status: 500 },
    );
  }
}
