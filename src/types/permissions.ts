export type ModuleKey =
  | "dashboard"
  | "produtos"
  | "nova-venda"
  | "clientes"
  | "historico";

export type ActionKey = "Visualizar" | "Adicionar" | "Editar" | "Excluir";

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  actions: {
    key: ActionKey;
    label: string;
  }[];
}

export const MODULES: ModuleDef[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    actions: [
      {
        key: "Visualizar",
        label: "Visualizar",
      },
    ],
  },
  {
    key: "produtos",
    label: "Produtos",
    actions: [
      {
        key: "Visualizar",
        label: "Visualizar",
      },
      {
        key: "Adicionar",
        label: "Adicionar",
      },
      {
        key: "Editar",
        label: "Editar",
      },
      {
        key: "Excluir",
        label: "Excluir",
      },
    ],
  },
  {
    key: "nova-venda",
    label: "Nova Venda",
    actions: [
      {
        key: "Visualizar",
        label: "Visualizar",
      },
      {
        key: "Adicionar",
        label: "Registrar venda",
      },
    ],
  },
  {
    key: "clientes",
    label: "Clientes",
    actions: [
      {
        key: "Visualizar",
        label: "Visualizar",
      },
      {
        key: "Adicionar",
        label: "Adicionar",
      },
      {
        key: "Editar",
        label: "Editar",
      },
      {
        key: "Excluir",
        label: "Excluir",
      },
    ],
  },
  {
    key: "historico",
    label: "Histórico",
    actions: [
      {
        key: "Visualizar",
        label: "Visualizar",
      },
      {
        key: "Editar",
        label: "Editar",
      },
      {
        key: "Excluir",
        label: "Excluir",
      },
    ],
  },
];

export type Permissions = Partial<Record<ModuleKey, ActionKey[]>>;

export interface AccessGroup {
  id: string;
  name: string;
  description: string;
  active: boolean;
  permissions: Permissions;
  createdAt: string;
}

export type PermissionChecker = (
  module: ModuleKey,
  action: ActionKey,
) => boolean;
