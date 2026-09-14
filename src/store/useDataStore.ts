import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product, Sale } from "@/types";
import { Client } from "@/prisma/client";

interface DataState {
  products: Product[];
  clients: Client[];
  sales: Sale[];
  setProducts: (p: Product[]) => void;
  setClients: (c: Client[]) => void;
  setSales: (s: Sale[]) => void;
  reset: () => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      products: [],
      clients: [],
      sales: [],
      setProducts: (p) => set({ products: p }),
      setClients: (c) => set({ clients: c }),
      setSales: (s) => set({ sales: s }),
      reset: () =>
        set({ products: [], clients: [], sales: [] }),
    }),
    {
      name: "revenda-data-v1",
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
  // Rehydrate on the client after hydration
  void useDataStore.persist.rehydrate();
}
