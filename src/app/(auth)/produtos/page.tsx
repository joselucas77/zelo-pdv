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
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from "@/prisma/client";
import { Loader2 } from "lucide-react";
import { usePermissions } from "@/components/auth/permissions-provider";

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
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<ProductFrontend | null>(null);
  const [creating, setCreating] = useState(false);
  const [stockDialog, setStockDialog] = useState<ProductFrontend | null>(null);
  const [deleting, setDeleting] = useState<ProductFrontend | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [fetchedProducts, fetchedCategories] = await Promise.all([
          productsService.list(),
          categoriesService.list(),
        ]);

        setProducts(fetchedProducts as ProductFrontend[]);
        setCategories(fetchedCategories as Category[]);
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
            : emptyForm
        }
        isEdit={!!editing}
        categories={categories}
        onCategoryCreated={(newCat) =>
          setCategories((prev) =>
            [...prev, newCat].sort((a, b) =>
              (a.name || "").localeCompare(b.name || ""),
            ),
          )
        }
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
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>

          <Button
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
  onSubmit,
  onCategoryCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: FormState;
  isEdit: boolean;
  categories: Category[];
  onSubmit: (data: FormState) => Promise<void>;
  onCategoryCreated: (category: Category) => void;
}) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState<FormState>(initial);
  const [busy, setBusy] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategoryBusy, setCreatingCategoryBusy] = useState(false);

  // Atualização segura para aceitar string temporariamente no input e converter para número
  const updateNumber = (k: keyof FormState, v: string) => {
    const num = v === "" ? 0 : Number(v);
    setForm((f) => ({ ...f, [k]: isNaN(num) ? 0 : num }));
  };

  const updateString = (k: keyof FormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const FormFields = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2 space-y-2">
        <Label>Nome</Label>
        <Input
          value={form.name}
          onChange={(e) => updateString("name", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Código (SKU)</Label>
        <Input
          value={form.code}
          onChange={(e) => updateString("code", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Código de Barras</Label>
        <Input
          value={form.barcode}
          onChange={(e) => updateString("barcode", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Unidade</Label>
        <Input
          value={form.unit}
          onChange={(e) => updateString("unit", e.target.value)}
          placeholder="Ex: UN, KG, CX"
        />
      </div>

      <div className="sm:col-span-2 space-y-2">
        <Label>URL da Imagem (Opcional)</Label>
        <Input
          value={form.image}
          onChange={(e) => updateString("image", e.target.value)}
          placeholder="https://exemplo.com/imagem.png"
        />
      </div>

      <div className="sm:col-span-2 space-y-2">
        <div className="flex items-center justify-between">
          <Label>Categoria</Label>
          {!isCreatingCategory && (
            <Button
              variant="link"
              className="h-auto p-0 text-xs text-primary"
              onClick={() => setIsCreatingCategory(true)}
            >
              + Nova categoria
            </Button>
          )}
        </div>
        {isCreatingCategory ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nome da categoria"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={creatingCategoryBusy}
            />
            <Button
              size="sm"
              disabled={!newCategoryName.trim() || creatingCategoryBusy}
              onClick={async () => {
                setCreatingCategoryBusy(true);
                try {
                  const newCat = (await categoriesService.create({
                    name: newCategoryName.trim(),
                  })) as any;

                  if (!newCat || typeof newCat !== "object") {
                    throw new Error("Resposta inválida do servidor");
                  }

                  // Tenta extrair a categoria caso venha envelopada (ex: { data: category })
                  const categoryToUse = newCat.id
                    ? newCat
                    : newCat.data?.id
                      ? newCat.data
                      : newCat;

                  if (!categoryToUse.id) {
                    throw new Error("ID da categoria não retornado");
                  }

                  onCategoryCreated(categoryToUse);
                  updateString("categoryId", String(categoryToUse.id));
                  setIsCreatingCategory(false);
                  setNewCategoryName("");
                  toast.success("Categoria criada!");
                } catch (e) {
                  console.error("Detailed error creating category:", e);
                  const msg =
                    e instanceof Error
                      ? e.message
                      : "Erro desconhecido ao criar categoria";
                  toast.error(`Erro ao criar categoria: ${msg}`);
                } finally {
                  setCreatingCategoryBusy(false);
                }
              }}
            >
              {creatingCategoryBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsCreatingCategory(false)}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Select
            value={form.categoryId}
            onValueChange={(value) =>
              updateString("categoryId", value as string)
            }
          >
            <SelectTrigger>
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
        )}
      </div>

      <div className="sm:col-span-2 space-y-2">
        <Label>Estoque atual</Label>
        <Input
          type="number"
          value={form.stock === 0 ? "" : form.stock}
          onChange={(e) => updateNumber("stock", e.target.value)}
          placeholder="0"
        />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label>Preço de custo</Label>
        <Input
          type="number"
          step="0.01"
          value={form.costPrice === 0 ? "" : form.costPrice}
          onChange={(e) => updateNumber("costPrice", e.target.value)}
          placeholder="0.00"
        />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label>Preço de venda</Label>
        <Input
          type="number"
          step="0.01"
          value={form.salePrice === 0 ? "" : form.salePrice}
          onChange={(e) => updateNumber("salePrice", e.target.value)}
          placeholder="0.00"
        />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label>Estoque mínimo</Label>
        <Input
          type="number"
          value={form.minStock === 0 ? "" : form.minStock}
          onChange={(e) => updateNumber("minStock", e.target.value)}
          placeholder="0"
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
        disabled={busy || !form.name.trim() || !form.categoryId}
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
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-screen">
          <DrawerHeader className="shrink-0 px-4">
            <DrawerTitle>
              {isEdit ? "Editar produto" : "Novo produto"}
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex min-h-0 flex-1 flex-col px-4 pb-6">
            <ScrollArea className="flex-1 **:data-radix-scroll-area-thumb:hidden">
              {FormFields}
            </ScrollArea>

            <div className="shrink-0 pt-4 border-t border-border">
              {ActionButtons}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
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
  );
}
