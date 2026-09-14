import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // 1. Busca o usuário e o grupo (usando 'group' conforme seu schema)
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        group: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 401 },
      );
    }

    const senhaValida = await bcrypt.compare(password, user.password);

    if (!senhaValida) {
      return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json(
        { error: "Este usuário está inativo." },
        { status: 403 },
      );
    }

    // 2. Monta o payload com as permissões estruturadas
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      permissions: user.group?.permissions || {},
    };

    // 3. Gera o JWT
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    const cookieStore = await cookies();

    // 4. Cookie Seguro (HttpOnly) para rotas e Server Actions
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 horas
    });

    // 5. Cookie Legível para acesso rápido no Frontend (Base64)
    const contextBase64 = Buffer.from(JSON.stringify(payload)).toString(
      "base64",
    );
    cookieStore.set("user_context", contextBase64, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({ success: true, user: payload });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Erro interno ao realizar login." },
      { status: 500 },
    );
  }
}
