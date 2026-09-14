"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { currency } from "@/lib/format";
import { ProductThumb } from "@/components/product-thumb";

export function ProductPicker({
  open,
  onClose,
  products,
  cartItems,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  products: import("@/types").Product[];
  cartItems: { productId: string; quantity: number }[];
  onPick: (p: import("@/types").Product) => void;
}) {
  const [q, setQ] = useState("");
  const isMobile = useIsMobile();

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(t) ||
            p.category?.toLowerCase().includes(t),
        )
      : products;
  }, [q, products]);

  const PickerContent = (
    <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
      <div className="relative shrink-0 mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar..."
          className="rounded-xl pl-9"
        />
      </div>
      <div className="min-h-0 flex-1">
        {/* SOLUÇÃO: Esconde a barra alvejando o elemento interno do Radix */}
        <ScrollArea className="h-full **:data-radix-scroll-area-thumb:hidden">
          <div className="space-y-1 pr-3 pb-4">
            {filtered.map((p) => {
              const cartQty = cartItems.find((i) => i.productId === p.id)?.quantity || 0;
              const remaining = p.stock - cartQty;
              return (
              <button
                key={p.id}
                onClick={() => onPick(p)}
                className="flex w-full items-center gap-3 rounded-xl border border-border/60 p-2.5 text-left transition hover:border-primary/40 hover:bg-accent disabled:opacity-50"
              >
                <ProductThumb name={p.name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {remaining} em estoque
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums">
                  {currency(p.salePrice as number)}
                </div>
                {remaining <= 0 && <Badge variant="outline" className="text-amber-600 border-amber-600/30">Sem estoque</Badge>}
              </button>
            )})}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="h-screen">
          <DrawerHeader className="flex-row items-center gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DrawerTitle>Produtos</DrawerTitle>
            </div>
          </DrawerHeader>
          {PickerContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-125 p-0 gap-0 overflow-hidden grid-rows-[auto_1fr] max-h-[85vh] [&>button]:hidden">
        <DialogHeader className="flex-row items-center gap-2 p-4 pb-0">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="ml-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle>Produtos</DialogTitle>
          </div>
        </DialogHeader>
        {PickerContent}
      </DialogContent>
    </Dialog>
  );
}
