"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Client } from "@/prisma/client";
import { ClientWithAddress } from "@/types";

// Tipagem segura para o endereço do formulário
export type AddressData = {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
};

export type ClientFormData = Omit<
  Client,
  "id" | "address" | "lojaId" | "deletedAt"
> & {
  address: AddressData;
};

const parseInitialAddress = (addressProp: any): AddressData => {
  const defaultAddr: AddressData = {
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  };

  if (!addressProp) return defaultAddr;

  if (Array.isArray(addressProp)) {
    const firstAddress = addressProp[0];

    if (!firstAddress) return defaultAddr;

    return {
      street: firstAddress.street || "",
      number: firstAddress.number || "",
      complement: firstAddress.complement || "",
      neighborhood: firstAddress.neighborhood || "",
      city: firstAddress.city || "",
      state: firstAddress.state || "",
      zipCode: firstAddress.zipCode || "",
    };
  }

  if (typeof addressProp === "string") {
    try {
      const parsed = JSON.parse(addressProp);
      return { ...defaultAddr, ...parsed };
    } catch {
      return defaultAddr;
    }
  }

  return { ...defaultAddr, ...addressProp };
};

export function ClientForm({
  open,
  onOpenChange,
  initial,
  isEdit,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: ClientWithAddress;
  isEdit: boolean;
  onSubmit: (data: any) => Promise<void>;
}) {
  const isMobile = useIsMobile();

  const getInitialState = useCallback(
    (): ClientFormData => ({
      name: initial?.name || "",
      phone: initial?.phone || "",
      email: initial?.email || "",
      address: parseInitialAddress(initial?.address),
      notes: initial?.notes || "",
      createdAt: initial?.createdAt || new Date(),
      updatedAt: initial?.updatedAt || new Date(),
    }),
    [initial],
  );

  const [form, setForm] = useState<ClientFormData>(getInitialState());
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "");

    // Só consulta quando tiver exatamente 8 dígitos
    if (cepLimpo.length !== 8) return;

    setCepLoading(true);

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`,
      );

      if (!response.ok) {
        throw new Error("Erro ao consultar o CEP");
      }

      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }

      // Preenche automaticamente todos os campos retornados pela API
      setForm((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
          complement: data.complemento || prev.address.complement || "",
        },
      }));

      toast.success("Endereço preenchido automaticamente!");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Não foi possível buscar o CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setForm(getInitialState());
    }
  }, [open, getInitialState]);

  const submit = async () => {
    setLoading(true);
    await onSubmit({
      ...form,
      email: form.email?.trim() === "" ? null : form.email,
      address: form.address,
    });
    setLoading(false);
  };

  const requiredInputClass =
    "border-primary/50 focus:ring-primary/50 bg-primary/[0.03]";

  const FormFields = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input
          className={requiredInputClass}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nome completo do cliente"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Telefone / WhatsApp</Label>
          <Input
            className={requiredInputClass}
            value={form.phone ?? ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="(00) 00000-0000"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input
            type="email"
            value={form.email ?? ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@exemplo.com"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
        <h3 className="text-sm font-medium">Endereço</h3>

        <div className="col-span-2 space-y-2">
          <Label>Rua</Label>
          <Input
            placeholder="Ex: Rua das Flores"
            value={form.address.street}
            onChange={(e) =>
              setForm({
                ...form,
                address: { ...form.address, street: e.target.value },
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Número</Label>
            <Input
              placeholder="Nº 123"
              value={form.address.number}
              onChange={(e) =>
                setForm({
                  ...form,
                  address: { ...form.address, number: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>CEP</Label>
            <Input
              placeholder="00000-000"
              value={form.address.zipCode}
              maxLength={9}
              disabled={cepLoading}
              onChange={(e) => {
                const value = e.target.value
                  .replace(/\D/g, "")
                  .replace(/^(\d{5})(\d)/, "$1-$2");

                setForm({
                  ...form,
                  address: {
                    ...form.address,
                    zipCode: value,
                  },
                });

                // Dispara a busca apenas quando completar os 8 dígitos numéricos
                if (value.replace(/\D/g, "").length === 8) {
                  buscarCep(value);
                }
              }}
            />
            {cepLoading && (
              <p className="text-xs text-muted-foreground">
                Buscando endereço...
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Complemento</Label>
          <Input
            placeholder="Apto 12, Bloco A"
            value={form.address.complement}
            onChange={(e) =>
              setForm({
                ...form,
                address: { ...form.address, complement: e.target.value },
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Bairro</Label>
          <Input
            placeholder="Centro"
            value={form.address.neighborhood}
            onChange={(e) =>
              setForm({
                ...form,
                address: { ...form.address, neighborhood: e.target.value },
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input
              placeholder="São Paulo"
              value={form.address.city}
              onChange={(e) =>
                setForm({
                  ...form,
                  address: { ...form.address, city: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Input
              placeholder="SP"
              value={form.address.state}
              onChange={(e) =>
                setForm({
                  ...form,
                  address: { ...form.address, state: e.target.value },
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          rows={3}
          value={form.notes ?? ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Anotações importantes sobre o cliente..."
        />
      </div>
    </div>
  );

  const ActionButtons = (
    <div className="flex w-full justify-end gap-3 mt-4">
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={loading}
      >
        Cancelar
      </Button>
      <Button
        disabled={form.name.trim().length < 2 || loading}
        onClick={submit}
      >
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh]">
          <DrawerHeader className="shrink-0 px-4">
            <DrawerTitle>{isEdit ? "Editar cliente" : "Adicionar"}</DrawerTitle>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full **:data-radix-scroll-area-thumb:hidden pr-4">
                <div className="pb-4">{FormFields}</div>
              </ScrollArea>
            </div>
            <div className="shrink-0 pt-4 mt-2 border-t border-border">
              {ActionButtons}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar cliente" : "Adicionar"}</DialogTitle>
        </DialogHeader>
        {FormFields}
        <DialogFooter>{ActionButtons}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
