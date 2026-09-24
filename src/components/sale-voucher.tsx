import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, Share2 } from "lucide-react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import Image from "next/image";
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
      className="mx-auto w-full max-w-md bg-white text-slate-900 overflow-hidden font-mono text-[13px] leading-tight"
      style={{ padding: "24px", boxShadow: "0 0 10px rgba(0,0,0,0.05)" }}
    >
      <div className="flex flex-col items-center text-center">
        <Image 
          src="/zelo.jpeg" 
          alt="Zelo Logo" 
          width={56} 
          height={56} 
          className="rounded-lg object-contain mb-3 grayscale"
        />
        
        <div className="font-bold uppercase text-sm">
          {store.name}
        </div>
        {voucher.resellerName && (
          <div className="uppercase">
            {voucher.resellerName}
          </div>
        )}
        {voucher.showContact && (
          <div className="uppercase mt-1 text-xs">
            {store.address && <div>{store.address}</div>}
            {store.phone && <div>TEL: {store.phone}</div>}
            {store.email && <div>{store.email}</div>}
          </div>
        )}

        <div className="mt-4 mb-2 font-bold text-base tracking-widest uppercase border-y border-dashed border-slate-400 py-1 w-full">
          CUPOM NÃO FISCAL
        </div>
      </div>

      <div className="text-left mt-2 space-y-1">
        <div className="uppercase">DATA: {dateTime(sale.date)}</div>
        <div className="uppercase">PEDIDO: #{code}</div>
        <div className="uppercase">CLIENTE: {sale.clientName}</div>
      </div>

      <div className="my-3 border-t border-dashed border-slate-400" />

      <div className="mt-2">
        <div className="mb-2 font-bold uppercase flex justify-between">
          <span>ITEM</span>
          <span>VALOR</span>
        </div>
        <div className="space-y-2">
          {sale.items.map((it) => (
            <div key={it.productId} className="flex flex-col">
              <span className="uppercase">{it.productName}</span>
              <div className="flex justify-between w-full">
                <span>{it.quantity} UN X {currency(it.unitPrice)}</span>
                <span>{currency(it.unitPrice * it.quantity)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="my-3 border-t border-dashed border-slate-400" />

      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between font-bold text-base">
          <span className="uppercase">TOTAL</span>
          <span>{currency(sale.total)}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="uppercase">PAGAMENTO</span>
          <span className="uppercase">{PAYMENT_LABELS[sale.paymentMethod]}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="uppercase">SITUAÇÃO</span>
          <span className="uppercase">{sale.status === "PAGO" ? "PAGO" : "PENDENTE"}</span>
        </div>
        {sale.dueDate && (
          <div className="flex items-center justify-between">
            <span className="uppercase">VENCIMENTO</span>
            <span>{new Date(sale.dueDate).toLocaleDateString("pt-BR")}</span>
          </div>
        )}
      </div>

      {sale.notes && (
        <div className="mt-4 p-2 border border-dashed border-slate-400 uppercase text-xs">
          OBS: {sale.notes}
        </div>
      )}

      <div className="my-4 border-t border-dashed border-slate-400" />

      <p className="mt-4 text-center text-xs uppercase font-bold">
        {voucher.footerText || "OBRIGADO PELA PREFERÊNCIA"}
      </p>
      <p className="mt-1 text-center text-[10px] uppercase">
        * DOCUMENTO SEM VALOR FISCAL *
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
