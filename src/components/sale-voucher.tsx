import { useEffect, useMemo, useRef, useState } from "react";
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
  const setStore = useSettingsStore((s) => s.setStore);
  const voucher = useSettingsStore((s) => s.voucher);
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      import("@/services/loja.service")
        .then(({ getLoja }) => getLoja())
        .then((res: any) => {
          if (res && res.name) {
            setStore({
              name: res.name,
              ownerName: res.ownerName || "",
              phone: res.phone || "",
              email: res.email || "",
              address: res.address || "",
              document: res.document || "",
            });
          }
        })
        .catch(() => {});
    }
  }, [open, setStore]);

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
      className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white text-slate-900 overflow-hidden"
      style={{ padding: "24px" }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
          <BadgeCheck className="h-7 w-7" />
        </div>
        {/* <div className="mt-3 text-lg font-bold text-slate-900">{store.name}</div> */}
        {voucher.resellerName && (
          <div className="text-sm font-medium text-slate-500">
            {voucher.resellerName}
          </div>
        )}
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          Obrigado!
        </h2>
        <p className="mt-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
          Pedido confirmado
        </p>
      </div>

      <div className="my-6 border-t-2 border-dashed border-slate-200" />

      <div className="text-center">
        <div className="text-sm font-medium text-slate-500">Comprovante de compra de</div>
        <div className="mt-1 text-xl font-bold text-slate-800">{sale.clientName}</div>
        <div className="mt-3 inline-flex rounded-lg bg-slate-100 px-4 py-1.5 text-sm font-bold tracking-widest text-slate-700">
          PEDIDO #{code}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400 text-center">
          Resumo da Compra
        </div>
        <div className="space-y-2">
          {sale.items.map((it) => (
            <div
              key={it.productId}
              className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 text-sm border border-slate-100"
            >
              <span className="min-w-0 flex-1 font-medium text-slate-700">
                <span className="tabular-nums text-slate-400 font-bold mr-1">
                  {it.quantity}×
                </span>
                {it.productName}
              </span>
              <span className="font-bold tabular-nums text-slate-900">
                {currency(it.unitPrice * it.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3 text-sm">
        <div className="flex items-center justify-between px-1">
          <span className="font-medium text-slate-500">Pagamento</span>
          <span className="font-bold text-slate-800">{PAYMENT_LABELS[sale.paymentMethod]}</span>
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="font-medium text-slate-500">Situação</span>
          <span className={`font-bold ${sale.status === "PAGO" ? "text-slate-900" : "text-slate-500"}`}>
            {sale.status === "PAGO" ? "Pago" : "Pendente"}
          </span>
        </div>
        {sale.dueDate && (
          <div className="flex items-center justify-between px-1">
            <span className="font-medium text-slate-500">Vencimento</span>
            <span className="font-bold text-slate-800">{new Date(sale.dueDate).toLocaleDateString("pt-BR")}</span>
          </div>
        )}
        <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 mt-4 text-white shadow-sm">
          <span className="text-base font-medium">Total</span>
          <span className="text-xl font-bold tabular-nums">{currency(sale.total)}</span>
        </div>
      </div>

      {sale.notes && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
          {sale.notes}
        </div>
      )}

      <div className="my-6 border-t-2 border-dashed border-slate-200" />

      <div className="flex items-center justify-between px-1">
        <div className="text-sm font-bold text-slate-800">{store.name}</div>
        <div className="text-xs font-medium text-slate-500 tabular-nums">
          {dateTime(sale.date)}
        </div>
      </div>
      {voucher.showContact && (store.phone || store.email || store.address) && (
        <div className="mt-2 space-y-1 text-xs font-medium text-slate-500 px-1">
          {store.phone && <div>{store.phone}</div>}
          {store.email && <div>{store.email}</div>}
          {store.address && <div>{store.address}</div>}
        </div>
      )}
      <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
    </div>
  );

  // 3. Renderização Mobile (Drawer)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="h-[90vh]">
          <DrawerHeader className="shrink-0 px-4">
            <DrawerTitle className="sr-only">Comprovante da venda</DrawerTitle>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div tabIndex={0} className="outline-none h-px w-full opacity-0" />
                <div className="pb-4">
                  {VoucherDesign}
                  <div className="mt-4">{ActionButtons}</div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // 4. Renderização Desktop (Modal)
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent 
        className="max-h-[90vh] sm:max-w-sm p-0 gap-0 overflow-hidden" 
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Comprovante da venda</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[90vh] w-full **:data-[slot=scroll-area-scrollbar]:hidden">
          <div tabIndex={0} className="outline-none h-px w-full opacity-0" />
          <div className="px-6 py-6">
            {VoucherDesign}
            <div className="mt-4">{ActionButtons}</div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
