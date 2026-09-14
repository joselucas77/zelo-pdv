import {
  LayoutDashboard,
  Package,
  Plus,
  Receipt,
  Settings,
  Users,
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  short: string;
  icon: typeof LayoutDashboard;
  primary?: boolean;
};

type TitlePage = {
  label: string;
  to: string;
};

export const NAV: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    short: "Início",
    icon: LayoutDashboard,
  },
  { to: "/produtos", label: "Produtos", short: "Produtos", icon: Package },
  {
    to: "/nova-venda",
    label: "Nova Venda",
    short: "Vender",
    icon: Plus,
    primary: true,
  },
  { to: "/clientes", label: "Clientes", short: "Clientes", icon: Users },
  { to: "/historico", label: "Histórico", short: "Vendas", icon: Receipt },
];

export const SECONDARY_NAV: NavItem[] = [
  {
    to: "/usuarios",
    label: "Usuários",
    short: "Usuários",
    icon: Users,
  },
  {
    to: "/configuracoes",
    label: "Configurações",
    short: "Config",
    icon: Settings,
  },
];

export const TitlePages: TitlePage[] = [
  { label: "Dashboard", to: "/" },
  { label: "Produtos", to: "/produtos" },
  { label: "Nova Venda", to: "/nova-venda" },
  { label: "Clientes", to: "/clientes" },
  { label: "Histórico", to: "/historico" },
  { label: "Configurações", to: "/configuracoes" },
  { label: "Usuários", to: "/usuarios" },
];

export const SettingsItens: NavItem[] = [
  {
    to: "/usuarios",
    label: "Usuários",
    short: "Usuários",
    icon: Users,
  },
  {
    to: "/configuracoes",
    label: "Configurações",
    short: "Config",
    icon: Settings,
  },
];
