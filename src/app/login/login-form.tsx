"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { loginSchema } from "@/lib/validations/auth";
import { authService } from "@/services/auth.service";

const REMEMBER_KEY = "revenda-remember-email-v1";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação Zod no Client
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(validation.data);

      // Gerencia o Lembre-me
      if (typeof window !== "undefined") {
        if (remember) {
          window.localStorage.setItem(REMEMBER_KEY, email.trim());
        } else {
          window.localStorage.removeItem(REMEMBER_KEY);
        }
      }

      toast.success(`Bem-vindo(a), seu PDV está pronto!`);
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]"
      />
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10 sm:px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Entrar na Revenda
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse sua conta para continuar vendendo.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="voce@minhaloja.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                  disabled={loading}
                />
                Lembrar de mim
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
