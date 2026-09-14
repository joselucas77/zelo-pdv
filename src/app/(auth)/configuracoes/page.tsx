"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Store as StoreIcon,
  ShieldCheck,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MODULES,
  useSettingsStore,
  type AccessGroup,
  type ActionKey,
  type ModuleKey,
  type Permissions,
} from "@/store/useSettingsStore";
import {
  createAccessGroup,
  deleteAccessGroup,
  getAccessGroups,
  updateAccessGroup,
} from "@/services/accessGroup.service";
import { createLoja, getLoja, updateLoja } from "@/services/loja.service";
import { LojaFormData, lojaSchema } from "@/lib/validations/loja";

export default function ConfiguracoesPage() {
  return (
    <div className="w-full px-4">
      <StoreSection />
      <GroupsSection />
    </div>
  );
}

function StoreSection() {
  const [lojaId, setLojaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const defaultForm: LojaFormData = {
    name: "",
    ownerName: "",
    document: "",
    phone: "",
    email: "",
    logo: "",
    active: true,
  };

  const [form, setForm] = useState<LojaFormData>(defaultForm);
  // Guardamos o estado original para habilitar/desabilitar o botão de Salvar e Cancelar
  const [original, setOriginal] = useState<LojaFormData>(defaultForm);

  useEffect(() => {
    async function fetchStoreData() {
      try {
        setLoading(true);
        const data = await getLoja();

        if (data && (data as { id?: string }).id) {
          setLojaId((data as { id?: string }).id ?? null);

          const storeData = {
            name: data.name || "",
            ownerName: data.ownerName || "",
            document: data.document || "",
            phone: data.phone || "",
            email: data.email || "",
            logo: data.logo || "",
            active: data.active ?? true,
          };

          setForm(storeData);
          setOriginal(storeData);
        }
      } catch (error: any) {
        // Ignora erros de "Não encontrado" (404), pois é o comportamento esperado na primeira vez.
        // Se a sua API retorna um status HTTP, você pode usar: if (error.status !== 404)
        if (!error.message?.toLowerCase().includes("não encontrada")) {
          console.error(error);
          toast.error("Erro ao carregar dados da loja");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchStoreData();
  }, []);

  const update = <K extends keyof LojaFormData>(k: K, v: LojaFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const dirty = JSON.stringify(form) !== JSON.stringify(original);

  // O botão só será habilitado se houve mudança, não estiver salvando e os campos obrigatórios estiverem preenchidos
  const canSave =
    dirty && !busy && form.name.trim() !== "" && form.ownerName.trim() !== "";

  const handleSave = async () => {
    // 1. Validação do Zod
    const parsed = lojaSchema.safeParse(form);

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Dados inválidos");
      return;
    }

    setBusy(true);
    try {
      // 2. Persistência via API (Create ou Update)
      if (lojaId) {
        await updateLoja(lojaId, parsed.data);
        toast.success("Dados da loja atualizados com sucesso");
      } else {
        const novaLoja = await createLoja(parsed.data);
        // Salvamos o novo ID retornado pela API para que os próximos envios sejam um "Update"
        setLojaId((novaLoja as { id: string }).id);
        toast.success("Loja cadastrada com sucesso");
      }

      // 3. Atualiza o estado original para refletir a nova base de dados salva
      setOriginal(form);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao salvar os dados da loja");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Carregando dados da loja...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <StoreIcon className="h-4 w-4 text-primary" />
          Dados da loja
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Nome da loja *</Label>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Ex.: Boutique Bella"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Responsável *</Label>
            <Input
              value={form.ownerName}
              onChange={(e) => update("ownerName", e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Documento (CNPJ/CPF)</Label>
            <Input
              value={form.document || ""}
              onChange={(e) => update("document", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Telefone</Label>
            <Input
              value={form.phone || ""}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={form.email || ""}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>URL da Logo</Label>
            <Input
              value={form.logo || ""}
              onChange={(e) => update("logo", e.target.value)}
              placeholder="https://exemplo.com/logo.png"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            disabled={!dirty || busy}
            onClick={() => setForm(original)}
          >
            Cancelar
          </Button>
          <Button disabled={!canSave} onClick={handleSave}>
            <Save className="mr-1 h-4 w-4" />
            {busy ? "Salvando..." : lojaId ? "Salvar alterações" : "Criar loja"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupsSection() {
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AccessGroup | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await getAccessGroups();
      const nonAdminGroups = (data as AccessGroup[]).filter(
        (g) => g.name !== "ADMIN",
      );
      setGroups(nonAdminGroups);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar grupos de acesso");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleToggleActive = async (group: AccessGroup) => {
    try {
      const updated = await updateAccessGroup(group.id, {
        active: !group.active,
      });
      setGroups(
        groups.map((g) => (g.id === group.id ? (updated as AccessGroup) : g)),
      );
      toast.success("Status do grupo atualizado");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao atualizar status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccessGroup(id);
      setGroups(groups.filter((g) => g.id !== id));
      toast.success("Grupo removido com sucesso");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao remover grupo");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Grupos de acesso
        </CardTitle>
        <Button
          size="sm"
          className="rounded-full"
          onClick={() => setCreating(true)}
        >
          <Plus className="mr-1 h-4 w-4" /> Novo grupo
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Carregando grupos...
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum grupo cadastrado.
          </div>
        ) : (
          groups.map((g) => {
            const total = totalPermissions(g.permissions as Permissions);
            return (
              <div
                key={g.id}
                className="flex flex-col gap-3 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-sm font-medium">{g.name}</div>
                    <Badge
                      variant="outline"
                      className={
                        g.active
                          ? "border-emerald-500/40 text-emerald-700"
                          : "border-muted-foreground/30 text-muted-foreground"
                      }
                    >
                      {g.active ? "Ativo" : "Inativo"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {total} permiss{total === 1 ? "ão" : "ões"}
                    </span>
                  </div>
                  {g.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {g.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <div className="flex items-center gap-2 pr-2">
                    <Switch
                      checked={g.active}
                      onCheckedChange={() => handleToggleActive(g)}
                      aria-label="Ativar grupo"
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setEditing(g)}
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    ></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover grupo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {g.name} será removido. Esta ação não pode ser
                          desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(g.id)}>
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <GroupForm
        open={creating || !!editing}
        initial={editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        onSuccess={fetchGroups}
      />
    </Card>
  );
}

function totalPermissions(p: Permissions): number {
  return Object.values(p).reduce((acc, arr) => acc + (arr?.length ?? 0), 0);
}

interface FormData {
  name: string;
  description: string;
  active: boolean;
  permissions: Permissions;
}

const emptyForm: FormData = {
  name: "",
  description: "",
  active: true,
  permissions: {},
};

function GroupForm({
  open,
  initial,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  initial: AccessGroup | null;
  onOpenChange: (o: boolean) => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              description: initial.description || "",
              active: initial.active,
              permissions: { ...(initial.permissions as Permissions) },
            }
          : emptyForm,
      );
    }
  }, [open, initial]);

  const isEdit = !!initial;

  const toggleAction = (mod: ModuleKey, action: ActionKey) => {
    setForm((f) => {
      const current = f.permissions[mod] ?? [];
      const next = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      return { ...f, permissions: { ...f.permissions, [mod]: next } };
    });
  };

  const setAllForModule = (mod: ModuleKey, all: boolean) => {
    setForm((f) => {
      const actions = MODULES.find((m) => m.key === mod)!.actions.map(
        (a) => a.key,
      );
      return {
        ...f,
        permissions: { ...f.permissions, [mod]: all ? actions : [] },
      };
    });
  };

  const totalSelected = useMemo(
    () => totalPermissions(form.permissions),
    [form.permissions],
  );

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome do grupo");
      return;
    }

    try {
      setSaving(true);
      if (isEdit && initial) {
        await updateAccessGroup(initial.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          active: form.active,
          permissions: form.permissions,
        });
        toast.success("Grupo atualizado com sucesso");
      } else {
        await createAccessGroup({
          name: form.name.trim(),
          description: form.description.trim(),
          active: form.active,
          permissions: form.permissions,
        });
        toast.success("Grupo criado com sucesso");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao salvar grupo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar grupo" : "Novo grupo de acesso"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-col gap-2">
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Vendedor"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-2">
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Para que serve este grupo?"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 p-3 sm:col-span-2">
              <div>
                <div className="text-sm font-medium">Status</div>
                <div className="text-xs text-muted-foreground">
                  Grupos inativos não concedem acesso aos usuários.
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

          <Separator />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Permissões por módulo</div>
                <div className="text-xs text-muted-foreground">
                  Selecione as ações permitidas em cada página do sistema.
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {totalSelected} selecionada{totalSelected === 1 ? "" : "s"}
              </span>
            </div>

            <div className="space-y-2">
              {MODULES.map((mod) => {
                const selected = form.permissions[mod.key] ?? [];
                const allChecked = selected.length === mod.actions.length;
                const someChecked = selected.length > 0 && !allChecked;
                return (
                  <div
                    key={mod.key}
                    className="rounded-lg border border-border/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={
                            allChecked ? true : someChecked ? undefined : false
                          }
                          onCheckedChange={(v) =>
                            setAllForModule(mod.key, v === true)
                          }
                          aria-label={`Selecionar todas de ${mod.label}`}
                        />
                        <div className="text-sm font-medium">{mod.label}</div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {selected.length}/{mod.actions.length}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 pl-6 sm:grid-cols-4">
                      {mod.actions.map((a) => {
                        const checked = selected.includes(a.key);
                        const id = `${mod.key}-${a.key}`;
                        return (
                          <label
                            key={a.key}
                            htmlFor={id}
                            className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-sm hover:border-border"
                          >
                            <Checkbox
                              id={id}
                              checked={checked}
                              onCheckedChange={() =>
                                toggleAction(mod.key, a.key)
                              }
                            />
                            {a.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!form.name.trim() || saving}>
            {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar grupo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
