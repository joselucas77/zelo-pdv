import { requireGuest } from "@/lib/proxy";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Intercepta a rota: se o usuário JÁ ESTIVER LOGADO, ele é
  // jogado direto pro /dashboard antes de ver a tela de login.
  await requireGuest();

  // Se não estiver logado, renderiza o formulário (Client Component)
  return <LoginForm />;
}
