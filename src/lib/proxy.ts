import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Função para proteger ROTAS PRIVADAS
export async function requireAuth() {
  const cookieStore = await cookies();
  // Alterado de "access_token" para "token"
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  return token;
}

// Função para proteger ROTAS PÚBLICAS (ex: página de login)
export async function requireGuest() {
  const cookieStore = await cookies();
  // Alterado de "access_token" para "token"
  const token = cookieStore.get("token")?.value;

  if (token) {
    redirect("/dashboard");
  }
}
