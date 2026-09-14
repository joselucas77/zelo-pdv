"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react"; // Ícone de loading
import { clientsService } from "@/services/clients.service";
import { salesService } from "@/services/sales.service";
import { getClientColumns } from "./columns";
import { ClientsDataTable } from "./data-table";
import { ClientForm } from "@/components/clients/client-form";
import ClientDetail from "@/components/clients/client-detail";
import DeleteClient from "@/components/clients/delete-client";
import type { ClientWithAddress, Sale } from "@/types";
import { usePermissions } from "@/components/auth/permissions-provider";
import { AlertTriangle } from "lucide-react";

export default function ClientesPage() {
  const { can } = usePermissions();
  const [clients, setClients] = useState<ClientWithAddress[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editing, setEditing] = useState<ClientWithAddress | null>(null);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<ClientWithAddress | null>(null);
  const [deleting, setDeleting] = useState<ClientWithAddress | null>(null);

  // Busca os dados iniciais assim que o componente é montado no navegador
  useEffect(() => {
    if (!can("clientes", "Visualizar")) {
      setIsLoading(false);
      return;
    }
    async function loadData() {
      try {
        setIsLoading(true);
        // Faz o fetch em paralelo nas duas APIs
        const [fetchedClients, fetchedSales] = await Promise.all([
          clientsService.list(),
          salesService.list(), // Previne que erro nas vendas quebre os clientes
        ]);
        setClients(fetchedClients);
        setSales(fetchedSales as Sale[]);
      } catch (error) {
        toast.error("Erro ao carregar a lista de clientes.");
        console.error("Erro ao carregar clientes ou vendas:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [can]);

  // Mescla os clientes com os dados das vendas
  const enrichedClients = useMemo(() => {
    return clients.map((c) => {
      const clientSales = sales.filter((s) => s.clientId === c.id) || [];
      return {
        ...c,
        totalSpent: clientSales.reduce(
          (sum, s) => sum + (Number(s.total) || 0),
          0,
        ),
        pendingAmount: clientSales
          .filter((s) => s.status === "PENDENTE")
          .reduce((sum, s) => sum + (Number(s.total) || 0), 0),
      };
    });
  }, [clients, sales]);

  const columns = useMemo(
    () =>
      getClientColumns({
        onView: setDetail,
        onEdit: setEditing,
        onDelete: setDeleting,
        can,
      }),
    [can],
  );

  // Tela de Loading enquanto os dados são buscados
  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Carregando dados dos clientes...</p>
      </div>
    );
  }

  if (!can("clientes", "Visualizar")) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <AlertTriangle className="h-12 w-12 text-destructive opacity-50" />
        <p className="text-sm font-medium">Você não tem permissão para visualizar clientes.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6">
      <ClientsDataTable
        columns={columns}
        data={enrichedClients}
        onCreateClick={() => setCreating(true)}
        canAdd={can("clientes", "Adicionar")}
      />

      <ClientForm
        key={editing?.id ?? "new"}
        open={creating || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        initial={editing ?? undefined}
        isEdit={!!editing}
        onSubmit={async (data) => {
          try {
            if (editing) {
              const updatedClient = await clientsService.update(
                editing.id,
                data,
              );
              setClients((prev) =>
                prev.map((c) =>
                  c.id === editing.id ? { ...c, ...updatedClient } : c,
                ),
              );
              toast.success("Cliente atualizado com sucesso!");
            } else {
              const newClient = await clientsService.create(data);
              setClients((prev) => [newClient, ...prev]);
              toast.success("Cliente cadastrado com sucesso!");
            }
            setCreating(false);
            setEditing(null);
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Ocorreu um erro inesperado.";
            toast.error(message);
          }
        }}
      />

      {detail && (
        <ClientDetail
          client={detail}
          sales={sales}
          onClose={() => setDetail(null)}
          onEdit={(c) => {
            setDetail(null);
            setEditing(c as ClientWithAddress);
          }}
        />
      )}

      <DeleteClient
        client={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(id) => {
          setClients((prev) => prev.filter((c) => c.id !== id));
          setDeleting(null);
        }}
      />
    </div>
  );
}
