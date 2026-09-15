"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { z } from "zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { getUserColumns, type UserTableData } from "./columns";
import { UsersDataTable } from "./data-table";

// Serviços
import { usersService } from "@/services/users.service";
import {
  getAccessGroups,
  type AccessGroupDTO,
} from "@/services/accessGroup.service";
import { usePermissions } from "@/components/auth/permissions-provider";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  groupId: string;
  active: boolean;
  password?: string;
  phone?: string | null;
  avatar?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  group?: AccessGroupDTO;
  isFirstUser?: boolean;
};

interface FormData {
  name: string;
  email: string;
  password?: string;
  phone?: string | null;
  avatar?: string | null;
  groupId: string;
  active: boolean;
}

const emptyForm: FormData = {
  name: "",
  email: "",
  password: "",
  phone: "",
  avatar: "",
  groupId: "",
  active: true,
};

// Schema do Zod para Validação no Frontend
const userFormSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().optional(),
  phone: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  groupId: z.string().min(1, "Selecione um grupo de acesso"),
  active: z.boolean(),
});

export default function UsuariosPage() {
  const { user: currentUser } = usePermissions();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [groups, setGroups] = useState<AccessGroupDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editing, setEditing] = useState<AppUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AppUser | null>(null);
  const [passwordResetting, setPasswordResetting] = useState<AppUser | null>(
    null,
  );

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [fetchedUsers, fetchedGroups] = await Promise.all([
          usersService.list(),
          getAccessGroups(),
        ]);
        setUsers(fetchedUsers);
        setGroups(fetchedGroups);
      } catch (error) {
        toast.error("Erro ao carregar os dados.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const enrichedUsers = useMemo(() => {
    return users.map((u, i) => {
      const group = groups.find((g) => g.id === u.groupId);
      return {
        ...u,
        groupLabel: group?.name || "Sem grupo",
        isFirstUser: i === 0, // Primeiro retornado pelo banco (mais antigo)
      };
    });
  }, [users, groups]);

  const columns = useMemo(
    () =>
      getUserColumns({
        onToggle: async (id) => {
          try {
            const user = users.find((u) => u.id === id);
            if (!user) return;
            const updated = await usersService.update(id, {
              active: !user.active,
            });
            setUsers((prev) =>
              prev.map((u) =>
                u.id === id ? { ...u, active: updated.active } : u,
              ),
            );
            toast.success("Status atualizado!");

            if (currentUser && updated.id === currentUser.sub) {
              window.location.reload();
            }
          } catch (error) {
            toast.error("Erro ao atualizar status.");
          }
        },
        onEdit: (u) => setEditing(u as AppUser),
        onDelete: (u) => setDeleting(u as AppUser),
        onChangePassword: (u) => setPasswordResetting(u as AppUser),
      }),
    [users, currentUser],
  );

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 px-4 w-full">
      <div className="mb-4 mt-6">
        <Link
          href="/configuracoes"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Configurações
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie os acessos ao sistema.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" /> Novo usuário
        </Button>
      </div>

      <UsersDataTable
        columns={columns}
        data={enrichedUsers}
        groups={groups as any}
        onCreateClick={() => setCreating(true)}
      />

      <UserForm
        key={editing?.id ?? "new"}
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        initial={editing}
        groups={groups}
        onSuccess={(updatedUser, isEdit) => {
          if (isEdit) {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === updatedUser.id ? { ...u, ...updatedUser } : u,
              ),
            );
            if (currentUser && updatedUser.id === currentUser.sub) {
              window.location.reload();
            }
          } else {
            setUsers((prev) => [updatedUser, ...prev]);
          }
          setCreating(false);
          setEditing(null);
        }}
      />

      <DeleteUser
        user={deleting}
        onClose={() => setDeleting(null)}
        onSuccess={(id) => {
          setUsers((prev) => prev.filter((u) => u.id !== id));
          setDeleting(null);
        }}
      />

      <ChangePasswordDialog
        user={passwordResetting}
        onClose={() => setPasswordResetting(null)}
      />
    </div>
  );
}

function UserForm({
  open,
  onOpenChange,
  initial,
  groups,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: AppUser | null;
  groups: AccessGroupDTO[];
  onSuccess: (user: AppUser, isEdit: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!initial;

  const selectableGroups = useMemo(() => {
    return groups.filter((g) => {
      if (g.name === "ADMIN") {
        return !!initial?.isFirstUser;
      }
      return true;
    });
  }, [groups, initial]);

  useEffect(() => {
    if (initial && open) {
      setForm({
        name: initial.name,
        email: initial.email,
        password: "",
        phone: initial.phone || "",
        avatar: initial.avatar || "",
        groupId: initial.groupId,
        active: initial.active,
      });
    } else if (!initial && open) {
      setForm(emptyForm);
    }
  }, [initial, open]);

  const submit = async () => {
    try {
      const validation = userFormSchema.safeParse(form);
      if (!validation.success) {
        return toast.error(validation.error.issues[0].message);
      }

      if (!isEdit && (!form.password || form.password.length < 6)) {
        return toast.error("A senha deve ter pelo menos 6 caracteres");
      }

      setIsSubmitting(true);

      if (isEdit && initial) {
        const updated = await usersService.update(initial.id, {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password ? form.password : undefined,
          phone: form.phone ? form.phone.trim() : undefined,
          avatar: form.avatar ? form.avatar.trim() : undefined,
          groupId: form.groupId,
          active: form.active,
        });
        toast.success("Usuário atualizado com sucesso!");
        onSuccess(updated, true);
      } else {
        const created = await usersService.create({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password!,
          phone: form.phone ? form.phone.trim() : undefined,
          avatar: form.avatar ? form.avatar.trim() : undefined,
          groupId: form.groupId,
          active: form.active,
        });
        toast.success("Usuário criado com sucesso!");
        onSuccess(created, false);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao processar.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiredInputClass =
    "border-primary/50 focus:ring-primary/50 bg-primary/[0.03]";

  const FormFields = (
    <div className="space-y-4">
      <div className="sm:col-span-2 space-y-2">
        <Label>Nome</Label>
        <Input
          className={requiredInputClass}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex.: Ana Silva"
        />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label>E-mail</Label>
        <Input
          className={requiredInputClass}
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="usuario@minhaloja.com"
        />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label>Telefone (Opcional)</Label>
        <Input
          type="tel"
          value={form.phone || ""}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="(11) 99999-9999"
        />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label>{isEdit ? "Nova Senha (Opcional)" : "Senha"}</Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={
              isEdit
                ? "Deixe em branco para manter a atual"
                : "Mínimo 6 caracteres"
            }
            className={cn("pr-10", !isEdit && requiredInputClass)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label>Escopo de acesso</Label>
        <Select
          value={form.groupId}
          onValueChange={(v) => setForm({ ...form, groupId: v as string })}
        >
          <SelectTrigger className={requiredInputClass}>
            <SelectValue placeholder="Selecione um grupo">
              {groups.find((g) => g.id === form.groupId)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {selectableGroups.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Nenhum grupo ativo cadastrado.
              </div>
            )}
            {selectableGroups.map((g) => (
              <SelectItem key={g.id} value={g.id!}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
        <div>
          <div className="text-sm font-medium">Status</div>
          <div className="text-xs text-muted-foreground">
            Usuários inativos não acessam o sistema.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {form.active ? "Ativo" : "Inativo"}
          </span>
          <Switch
            checked={form.active}
            onCheckedChange={(v) => setForm({ ...form, active: v })}
          />
        </div>
      </div>
    </div>
  );

  const ActionButtons = (
    <div className="flex gap-2 w-full justify-between">
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isSubmitting}
      >
        Cancelar
      </Button>
      <Button onClick={submit} disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEdit ? "Salvar alterações" : "Criar usuário"}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh]">
          <DrawerHeader className="shrink-0 px-4">
            <DrawerTitle>
              {isEdit ? "Editar usuário" : "Novo usuário"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full **:data-radix-scroll-area-thumb:hidden">
                <div className="pb-4">{FormFields}</div>
              </ScrollArea>
            </div>
            <div className="shrink-0 pt-4 border-t border-border">
              {ActionButtons}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar usuário" : "Novo usuário"}
          </DialogTitle>
        </DialogHeader>
        {FormFields}
        <DialogFooter>{ActionButtons}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUser({
  user,
  onClose,
  onSuccess,
}: {
  user: AppUser | null;
  onClose: () => void;
  onSuccess: (id: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;
    try {
      setIsDeleting(true);
      await usersService.delete(user.id);
      toast.success("Usuário removido");
      onSuccess(user.id);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir usuário");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
          <AlertDialogDescription>
            {user?.name} perderá o acesso ao sistema. Esta ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Remover"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ChangePasswordDialog({
  user,
  onClose,
}: {
  user: AppUser | null;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      setPassword("");
      setShowPassword(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (password.length < 6) {
      return toast.error("A senha deve ter pelo menos 6 caracteres");
    }

    try {
      setIsSubmitting(true);
      await usersService.update(user.id, {
        password: password,
      });
      toast.success("Senha alterada com sucesso!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao alterar senha.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trocar Senha</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Defina uma nova senha para o usuário <strong>{user?.name}</strong>
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar nova senha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
