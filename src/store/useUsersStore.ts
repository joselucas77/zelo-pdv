import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string;
  groupId: string;
  active: boolean;
  createdAt: string;
}

interface UsersState {
  users: AppUser[];
  addUser: (u: Omit<AppUser, "id" | "createdAt">) => void;
  updateUser: (id: string, u: Partial<AppUser>) => void;
  removeUser: (id: string) => void;
  toggleUser: (id: string) => void;
}

const uid = () => "u_" + Math.random().toString(36).slice(2, 10);

const defaultUsers: AppUser[] = [
  {
    id: "u_admin",
    name: "Administrador",
    email: "admin@minhaloja.com",
    password: "admin123",
    groupId: "g_admin",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "u_vendedor",
    name: "Ana Vendedora",
    email: "ana@minhaloja.com",
    password: "vendas123",
    groupId: "g_vendedor",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const useUsersStore = create<UsersState>()(
  persist(
    (set) => ({
      users: defaultUsers,
      addUser: (u) =>
        set((state) => ({
          users: [
            { ...u, id: uid(), createdAt: new Date().toISOString() },
            ...state.users,
          ],
        })),
      updateUser: (id, u) =>
        set((state) => ({
          users: state.users.map((it) => (it.id === id ? { ...it, ...u } : it)),
        })),
      removeUser: (id) =>
        set((state) => ({ users: state.users.filter((it) => it.id !== id) })),
      toggleUser: (id) =>
        set((state) => ({
          users: state.users.map((it) =>
            it.id === id ? { ...it, active: !it.active } : it,
          ),
        })),
    }),
    {
      name: "revenda-users-v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : (undefined as unknown as Storage),
      ),
      skipHydration: true,
    },
  ),
);

if (typeof window !== "undefined") {
  void useUsersStore.persist.rehydrate();
}
