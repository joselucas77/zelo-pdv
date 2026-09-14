import { useMemo, useRef, useState } from "react";
import { BadgeCheck, Download, FileText, Share2 } from "lucide-react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettingsStore } from "@/store/useSettingsStore";
import { currency, dateTime } from "@/lib/format";
import { PAYMENT_LABELS, type Sale } from "@/types";

interface Props {
  sale: Sale | null;
  open: boolean;
  onClose: () => void;
  clientPhone?: string;
}

export function SaleVoucher({ sale, open, onClose, clientPhone }: Props) {
  const isMobile = useIsMobile();
  const store = useSettingsStore((s) => s.store);
  const voucher = useSettingsStore((s) => s.voucher);
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Otimização: Memoiza o código para não recalcular a cada render
  const code = useMemo(
    () =>
      sale
        ? sale.id
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(-6)
            .toUpperCase()
        : "",
    [sale],
  );

  const render = async () => {
    if (!ref.current) throw new Error("sem conteúdo");
    const el = ref.current;

    // TRUQUE: Expande temporariamente o conteúdo para o html-to-image capturar tudo,
    // evitando que o ScrollArea corte a imagem no PDF/PNG.
    const prevHeight = el.style.height;
    const prevOverflow = el.style.overflow;
    el.style.height = "auto";
    el.style.overflow = "visible";

    const viewport = el.closest(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
    if (viewport) {
      viewport.style.height = "auto";
      viewport.style.overflow = "visible";
    }

    try {
      return await toPng(el, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
    } finally {
      // Restaura os estilos originais após a captura
      el.style.height = prevHeight;
      el.style.overflow = prevOverflow;
      if (viewport) {
        viewport.style.height = "";
        viewport.style.overflow = "";
      }
    }
  };

  const downloadPng = async () => {
    try {
      setBusy("png");
      const url = await render();
      const a = document.createElement("a");
      a.href = url;
      a.download = `comprovante-${code}.png`;
      a.click();
      toast.success("Imagem baixada");
    } catch {
      toast.error("Não foi possível gerar a imagem");
    } finally {
      setBusy(null);
    }
  };

  const downloadPdf = async () => {
    try {
      setBusy("pdf");
      const url = await render();
      const img = new Image();
      img.src = url;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });
      const { jsPDF } = await import("jspdf");
      const w = 80;
      const h = (img.height / img.width) * w;
      const pdf = new jsPDF({ unit: "mm", format: [w, h] });
      pdf.addImage(url, "PNG", 0, 0, w, h);
      pdf.save(`comprovante-${code}.pdf`);
      toast.success("PDF gerado");
    } catch {
      toast.error("Não foi possível gerar o PDF");
    } finally {
      setBusy(null);
    }
  };

  const shareWhatsapp = async () => {
    if (!sale) return;
    try {
      setBusy("share");
      const url = await render();
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], `comprovante-${code}.png`, {
        type: "image/png",
      });
      const text = `Comprovante ${code} — ${store.name}\n${sale.clientName}\nTotal: ${currency(sale.total)}`;

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `comprovante-${code}.png`;
        a.click();
        const phone = (clientPhone || "").replace(/\D/g, "");
        window.open(
          `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
          "_blank",
        );
        toast.success("Imagem baixada — anexe na conversa do WhatsApp");
      }
    } catch {
      toast.error("Não foi possível compartilhar");
    } finally {
      setBusy(null);
    }
  };

  // 1. Extrair o design do comprovante (O ref fica aqui)
  const VoucherDesign = sale ? (
    <div
      ref={ref}
      className="rounded-2xl border border-border bg-card p-5 text-card-foreground"
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BadgeCheck className="h-6 w-6" />
        </div>
        <div className="mt-2 text-base font-semibold">{store.name}</div>
        {voucher.resellerName && (
          <div className="text-xs text-muted-foreground">
            {voucher.resellerName}
          </div>
        )}
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Obrigado!
        </h2>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Pedido confirmado
        </p>
      </div>

      <div className="my-4 border-t border-dashed border-border" />

      <div className="text-center text-sm">
        <div className="text-muted-foreground">Comprovante de compra de</div>
        <div className="mt-0.5 text-lg font-semibold">{sale.clientName}</div>
        <div className="mt-2 inline-flex rounded-full border border-border px-3 py-1 text-xs font-medium tabular-nums">
          Pedido #{code}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Itens
        </div>
        <div className="space-y-1.5">
          {sale.items.map((it) => (
            <div
              key={it.productId}
              className="flex items-start justify-between gap-3 rounded-lg bg-muted/60 px-2.5 py-1.5 text-sm"
            >
              <span className="min-w-0 flex-1">
                <span className="tabular-nums text-muted-foreground">
                  {it.quantity}×{" "}
                </span>
                {it.productName}
              </span>
              <span className="font-medium tabular-nums">
                {currency(it.unitPrice * it.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-1 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Pagamento</span>
          <span>{PAYMENT_LABELS[sale.paymentMethod]}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Situação</span>
          <span>{sale.status === "PAGO" ? "Pago" : "Pendente"}</span>
        </div>
        {sale.dueDate && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Vencimento</span>
            <span>{new Date(sale.dueDate).toLocaleDateString("pt-BR")}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{currency(sale.total)}</span>
        </div>
      </div>

      {sale.notes && (
        <div className="mt-3 rounded-lg bg-muted p-2 text-xs text-muted-foreground">
          {sale.notes}
        </div>
      )}

      <div className="my-4 border-t border-dashed border-border" />

      <div className="flex items-end justify-between">
        <div className="text-base font-semibold">{store.name}</div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {dateTime(sale.date)}
        </div>
      </div>
      {voucher.showContact && (store.phone || store.email || store.address) && (
        <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
          {store.phone && <div>{store.phone}</div>}
          {store.email && <div>{store.email}</div>}
          {store.address && <div>{store.address}</div>}
        </div>
      )}
      <p className="mt-3 whitespace-pre-line text-center text-[10px] uppercase tracking-wider text-muted-foreground">
        {voucher.footerText || "Documento sem valor fiscal"}
      </p>
    </div>
  ) : null;

  // 2. Extrair os botões de ação
  const ActionButtons = (
    <div className="space-y-2">
      <Button
        className="h-12 w-full rounded-full"
        onClick={shareWhatsapp}
        disabled={!!busy}
      >
        <Share2 className="mr-2 h-4 w-4" />
        Compartilhar via WhatsApp
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="h-11 rounded-full"
          onClick={downloadPdf}
          disabled={!!busy}
        >
          <FileText className="mr-2 h-4 w-4" /> PDF
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-full"
          onClick={downloadPng}
          disabled={!!busy}
        >
          <Download className="mr-2 h-4 w-4" /> Imagem
        </Button>
      </div>
      <Button variant="ghost" className="w-full" onClick={onClose}>
        Fechar
      </Button>
    </div>
  );

  // 3. Renderização Mobile (Drawer)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="h-screen">
          <DrawerHeader className="shrink-0 px-4">
            <DrawerTitle>Comprovante da venda</DrawerTitle>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 overflow-hidden">
            <ScrollArea className="flex-1 **:data-radix-scroll-area-thumb:hidden">
              {VoucherDesign}
              <div className="mt-4">{ActionButtons}</div>
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // 4. Renderização Desktop (Modal)
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-hidden flex flex-col sm:max-w-sm p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Comprovante da venda</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 pt-6 **:data-radix-scroll-area-thumb:hidden">
          {VoucherDesign}
          <div className="mt-4 pb-6">{ActionButtons}</div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
