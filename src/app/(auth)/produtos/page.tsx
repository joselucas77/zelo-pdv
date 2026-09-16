"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getProductColumns, ProductFrontend } from "./columns";
import { ProductsDataTable } from "./data-table";
import { productsService } from "@/services/products.service";
import { categoriesService } from "@/services/categories.service";
import { unitsService, Unit } from "@/services/units.service";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from "@/prisma/client";
import { Loader2, ScanBarcode } from "lucide-react";
import { usePermissions } from "@/components/auth/permissions-provider";
import { BarcodeScanner } from "@/components/barcode-scanner";

// 1. Estado do Formulário usa NUMBER agora, compatível com frontend
export type FormState = {
  name: string;
  categoryId: string;
  description: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  notes: string;
  barcode: string;
  code: string;
  unit: string;
  image: string;
};

// 2. Variável que estava faltando
const emptyForm: FormState = {
  name: "",
  categoryId: "",
  description: "",
  costPrice: 0,
  salePrice: 0,
  stock: 0,
  minStock: 0,
  notes: "",
  barcode: "",
  code: "",
  unit: "UN",
  image: "",
};

export default function ProdutosPage() {
  const { can } = usePermissions();
  const [products, setProducts] = useState<ProductFrontend[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<ProductFrontend | null>(null);
  const [creating, setCreating] = useState(false);
  const [stockDialog, setStockDialog] = useState<ProductFrontend | null>(null);
  const [deleting, setDeleting] = useState<ProductFrontend | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [fetchedProducts, fetchedCategories, fetchedUnits] =
          await Promise.all([
            productsService.list(),
            categoriesService.list(),
            unitsService.getUnits(),
          ]);

        setProducts(fetchedProducts as ProductFrontend[]);
        setCategories(fetchedCategories as Category[]);
        setUnits(fetchedUnits as Unit[]);
      } catch (error) {
        toast.error("Erro ao carregar dados dos produtos.");
        console.error("Erro ao carregar produtos ou categorias:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Extrai apenas os nomes para alimentar o filtro do Data-table
  const categoryNames = useMemo(
    () => categories.map((c) => c.name).sort(),
    [categories],
  );

  const columns = useMemo(
    () =>
      getProductColumns({
        onStock: setStockDialog,
        onEdit: setEditing,
        onDelete: setDeleting,
        can,
      }),
    [can],
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Carregando dados dos produtos...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4">
      <ProductsDataTable
        columns={columns}
        data={products}
        categories={categoryNames}
        onCreateClick={() => setCreating(true)}
      />

      <ProductForm
        key={editing?.id ?? "new"}
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        initial={
          editing
            ? {
                name: editing.name,
                categoryId: editing.categoryId || "",
                description: editing.description || "",
                costPrice: editing.costPrice,
                salePrice: editing.salePrice,
                stock: editing.stock,
                minStock: editing.minStock,
                notes: editing.notes || "",
                barcode: editing.barcode || "",
                code: editing.code || "",
                unit: editing.unit || "UN",
                image: editing.image || "",
              }
            : {
                ...emptyForm,
                categoryId:
                  categories.find((c) => c.name === "Diversos")?.id || "",
              }
        }
        isEdit={!!editing}
        categories={categories}
        units={units}
        onSubmit={async (data) => {
          try {
            if (editing) {
              const updatedProduct = (await productsService.update(
                editing.id,
                data,
              )) as ProductFrontend;

              setProducts((prev) =>
                prev.map((product) =>
                  product.id === editing.id
                    ? { ...product, ...updatedProduct }
                    : product,
                ),
              );

              toast.success("Produto atualizado com sucesso!");
            } else {
              const newProduct = (await productsService.create(
                data,
              )) as ProductFrontend;

              setProducts((prev) => [newProduct, ...prev]);

              toast.success("Produto cadastrado com sucesso!");
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

      <StockEntry
        product={stockDialog}
        onClose={() => setStockDialog(null)}
        onSuccess={(updatedProduct) => {
          setProducts((prev) =>
            prev.map((product) =>
              product.id === updatedProduct.id
                ? { ...product, ...updatedProduct }
                : product,
            ),
          );
        }}
      />

      <DeleteProduct
        product={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async (id) => {
          try {
            await productsService.remove(id);

            setProducts((prev) => prev.filter((product) => product.id !== id));

            toast.success("Produto removido com sucesso!");
            setDeleting(null);
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Erro ao remover produto.";

            toast.error(message);
          }
        }}
      />
    </div>
  );
}

function DeleteProduct({
  product,
  onClose,
  onConfirm,
}: {
  product: ProductFrontend | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}) {
  return (
    <AlertDialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover produto?</AlertDialogTitle>

          <AlertDialogDescription>
            {product?.name} será removido do catálogo. Esta ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>

          <AlertDialogAction
            onClick={async () => {
              if (!product) return;

              await onConfirm(product.id);
            }}
          >
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function StockEntry({
  product,
  onClose,
  onSuccess,
}: {
  product: ProductFrontend | null;
  onClose: () => void;
  onSuccess: (product: ProductFrontend) => void;
}) {
  const [qty, setQty] = useState(1);
  const [rawQty, setRawQty] = useState("1");

  const handleQtyChange = (value: string) => {
    // Remove zeros iniciais (ex: "01" → "1")
    const cleaned = value.replace(/^0+(\d)/, "$1");
    setRawQty(cleaned);
    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num > 0) {
      setQty(num);
    } else {
      setQty(0);
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Entrada de estoque</DialogTitle>
        </DialogHeader>

        {product && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {product.name}
              </span>{" "}
              — atual: {product.stock}
            </div>

            <div className="space-y-2">
              <Label>Quantidade a adicionar</Label>

              <Input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                inputMode="numeric"
                onFocus={(e) => e.target.select()}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            disabled={qty <= 0}
            onClick={async () => {
              if (!product || qty <= 0) return;

              try {
                const updatedProduct = await productsService.addStock(
                  product.id,
                  qty,
                );

                onSuccess(updatedProduct as ProductFrontend);

                toast.success(`+${qty} un adicionados`);

                setQty(1);
                setRawQty("1");
                onClose();
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Erro ao adicionar estoque.";

                toast.error(message);
              }
            }}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductForm({
  open,
  onOpenChange,
  initial,
  isEdit,
  categories,
  units,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: FormState;
  isEdit: boolean;
  categories: Category[];
  units: Unit[];
  onSubmit: (data: FormState) => Promise<void>;
}) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState<FormState>(initial);
  const [busy, setBusy] = useState(false);
  // Guardamos os valores dos campos numéricos como string durante a digitação
  const [rawValues, setRawValues] = useState<Record<string, string>>({
    costPrice: initial.costPrice === 0 ? "" : String(initial.costPrice),
    salePrice: initial.salePrice === 0 ? "" : String(initial.salePrice),
    stock: initial.stock === 0 ? "" : String(initial.stock),
    minStock: initial.minStock === 0 ? "" : String(initial.minStock),
  });

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Atualiza um campo de texto simples
  const updateString = (k: keyof FormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Para campos numéricos: mantém o rawValue durante digitação e só commita um número válido
  const handleNumericChange = (k: keyof FormState, raw: string) => {
    // Aceita vírgula e ponto como separador decimal, normaliza para ponto
    const normalized = raw.replace(",", ".");
    setRawValues((prev) => ({ ...prev, [k]: raw }));
    const num = parseFloat(normalized);
    if (!isNaN(num) && num >= 0) {
      setForm((f) => ({ ...f, [k]: num }));
    } else if (normalized === "" || normalized === "." || normalized === ",") {
      setForm((f) => ({ ...f, [k]: 0 }));
    }
  };

  // Ao sair do campo (onBlur), formata o valor
  const handleNumericBlur = (k: keyof FormState) => {
    const num = form[k] as number;
    setRawValues((prev) => ({ ...prev, [k]: num === 0 ? "" : String(num) }));
  };

  // Validação dos campos obrigatórios
  const canSave =
    form.name.trim().length >= 2 &&
    form.categoryId.trim() !== "" &&
    form.unit.trim() !== "" &&
    (form.salePrice as number) > 0;

  const requiredInputClass =
    "border-primary/50 focus:ring-primary/50 bg-primary/[0.03]";

  const FormFields = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2 space-y-2">
        <Label>Nome</Label>
        <Input
          className={requiredInputClass}
          value={form.name}
          onChange={(e) => updateString("name", e.target.value)}
          placeholder="Nome do produto"
        />
      </div>

      <div className="sm:col-span-2 space-y-2">
        <Label>Descrição</Label>
        <Textarea
          rows={2}
          value={form.description}
          onChange={(e) => updateString("description", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Código (Alternativo)</Label>
        <Input
          value={form.code}
          onChange={(e) => updateString("code", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Código de Barras</Label>
        <div className="flex gap-2">
          <Input
            value={form.barcode}
            onChange={(e) => updateString("barcode", e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 lg:hidden"
            onClick={() => setIsScannerOpen(true)}
          >
            <ScanBarcode className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Unidade</Label>
        <Select
          value={form.unit || ""}
          onValueChange={(value) => updateString("unit", value as string)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione uma unidade">
              {units.find((u) => u.abbreviation === form.unit)?.name ||
                form.unit}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u.id} value={u.abbreviation}>
                {u.name} ({u.abbreviation})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select
          value={form.categoryId}
          onValueChange={(value) => updateString("categoryId", value as string)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione uma categoria">
              {categories.find((c) => c.id === form.categoryId)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Preço de venda</Label>
        <Input
          className={requiredInputClass}
          inputMode="decimal"
          value={rawValues.salePrice}
          onChange={(e) => handleNumericChange("salePrice", e.target.value)}
          onBlur={() => handleNumericBlur("salePrice")}
          placeholder="00,00"
        />
      </div>

      <div className="space-y-2">
        <Label>Preço de custo</Label>
        <Input
          inputMode="decimal"
          value={rawValues.costPrice}
          onChange={(e) => handleNumericChange("costPrice", e.target.value)}
          onBlur={() => handleNumericBlur("costPrice")}
          placeholder="00,00"
        />
      </div>

      <div className="space-y-2">
        <Label>Estoque atual</Label>
        <Input
          inputMode="decimal"
          value={rawValues.stock}
          onChange={(e) => handleNumericChange("stock", e.target.value)}
          onBlur={() => handleNumericBlur("stock")}
          placeholder="0"
        />
      </div>

      <div className="space-y-2">
        <Label>Estoque mínimo</Label>
        <Input
          inputMode="decimal"
          value={rawValues.minStock}
          onChange={(e) => handleNumericChange("minStock", e.target.value)}
          onBlur={() => handleNumericBlur("minStock")}
          placeholder="0"
        />
      </div>

      <div className="sm:col-span-2 space-y-2">
        <Label>URL da Imagem</Label>
        <Input
          value={form.image}
          onChange={(e) => updateString("image", e.target.value)}
          placeholder="https://exemplo.com/imagem.png"
        />
      </div>

      <div className="sm:col-span-2 space-y-2">
        <Label>Observações</Label>
        <Textarea
          rows={2}
          value={form.notes ?? ""}
          onChange={(e) => updateString("notes", e.target.value)}
        />
      </div>
    </div>
  );

  const ActionButtons = (
    <div className="flex w-full justify-between gap-2">
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Cancelar
      </Button>
      <Button
        disabled={busy || !canSave}
        onClick={async () => {
          setBusy(true);
          try {
            await onSubmit(form);
          } finally {
            setBusy(false);
          }
        }}
      >
        {isEdit ? "Salvar" : "Cadastrar"}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="h-[90vh]">
            <DrawerHeader className="shrink-0 px-4">
              <DrawerTitle>
                {isEdit ? "Editar produto" : "Novo produto"}
              </DrawerTitle>
            </DrawerHeader>

            <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full **:data-radix-scroll-area-thumb:hidden pr-4">
                  <div className="pb-4">{FormFields}</div>
                </ScrollArea>
              </div>

              <div className="shrink-0 pt-4 border-t border-border">
                {ActionButtons}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
        <BarcodeScanner
          open={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          onScan={(barcode) => updateString("barcode", barcode)}
        />
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editar produto" : "Novo produto"}
            </DialogTitle>
          </DialogHeader>
          {FormFields}
          <DialogFooter>{ActionButtons}</DialogFooter>
        </DialogContent>
      </Dialog>
      <BarcodeScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={(barcode) => updateString("barcode", barcode)}
      />
    </>
  );
}
