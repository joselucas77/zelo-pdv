import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Sale } from "@/types";

export interface VoucherRecord {
  id: string;
  code: string;
  saleId: string;
  createdAt: string;
  sale: Sale;
  clientPhone?: string;
}

interface VouchersState {
  vouchers: VoucherRecord[];
  addVoucher: (v: Omit<VoucherRecord, "id" | "createdAt">) => void;
  removeVoucher: (id: string) => void;
}

export const voucherCode = (saleId: string) =>
  saleId
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase();

export const useVouchersStore = create<VouchersState>()(
  persist(
    (set) => ({
      vouchers: [],
      addVoucher: (v) =>
        set((state) => ({
          vouchers: [
            {
              ...v,
              id: "v_" + Math.random().toString(36).slice(2, 10),
              createdAt: new Date().toISOString(),
            },
            ...state.vouchers.filter((it) => it.saleId !== v.saleId),
          ],
        })),
      removeVoucher: (id) =>
        set((state) => ({
          vouchers: state.vouchers.filter((v) => v.id !== id),
        })),
    }),
    {
      name: "revenda-vouchers-v1",
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
  void useVouchersStore.persist.rehydrate();
}
