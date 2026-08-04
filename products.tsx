import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductImage } from "@/components/shop/ProductImage";
import { supabase } from "@/integrations/supabase/client";
import {
  categoriesQuery,
  formatBDT,
  productsQuery,
  uploadShopImage,
  type Category,
  type Product,
} from "@/lib/shop";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

type Draft = {
  id?: string;
  name: string;
  price: string;
  stock: string;
  category: string;
  description: string;
  image: string | null;
};

const emptyDraft: Draft = {
  name: "",
  price: "",
  stock: "0",
  category: "",
  description: "",
  image: null,
};

function AdminProducts() {
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useQuery(productsQuery());
  const { data: categories } = useQuery(categoriesQuery);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [catName, setCatName] = useState("");

  function edit(product: Product) {
    setDraft({
      id: product.id,
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      category: product.category ?? "",
      description: product.description ?? "",
      image: product.image,
    });
  }

  async function pickImage(file: File | undefined) {
    if (!file || !draft) return;
    setUploading(true);
    try {
      const url = await uploadShopImage(file);
      setDraft({ ...draft, image: url });
      toast.success("Image uploaded");
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!draft) return;
    if (!draft.name.trim() || !draft.price) {
      toast.error("Name and price are required");
      return;
    }
    setSaving(true);
    const payload = {
      name: draft.name.trim(),
      price: Number(draft.price),
      stock: Number(draft.stock || 0),
      category: draft.category || null,
      description: draft.description.trim() || null,
      image: draft.image,
    };
    const { error } = draft.id
      ? await supabase.from("products").update(payload).eq("id", draft.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) {
      toast.error("Could not save product", { description: error.message });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["products"] });
    setDraft(null);
    toast.success(draft.id ? "Product updated" : "Product added");
  }

  async function remove(product: Product) {
    if (!confirm(`Delete "${product.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      toast.error("Could not delete", { description: error.message });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["products"] });
    toast.success("Product deleted");
  }

  async function addCategory() {
    if (!catName.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: catName.trim() });
    if (error) {
      toast.error("Could not add category", { description: error.message });
      return;
    }
    setCatName("");
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    toast.success("Category added");
  }

  async function removeCategory(category: Category) {
    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    if (error) {
      toast.error("Could not delete category", { description: error.message });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Products</h1>
        <Button variant="hero" onClick={() => setDraft({ ...emptyDraft })}>
          <Plus /> Add product
        </Button>
      </div>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-display text-lg font-bold">Categories</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(categories ?? []).map((category) => (
            <span
              key={category.id}
              className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 py-1 pl-3 pr-1 text-sm"
            >
              {category.name}
              <button
                type="button"
                aria-label={`Delete ${category.name}`}
                className="grid size-6 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                onClick={() => removeCategory(category)}
              >
                <Trash2 className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={catName}
            placeholder="New category name"
            onChange={(e) => setCatName(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" onClick={addCategory}>
            Add
          </Button>
        </div>
      </section>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading products…</div>
        ) : (
          <ul className="divide-y divide-border">
            {(products ?? []).map((product) => (
              <li key={product.id} className="flex items-center gap-3 p-3">
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  className="size-14 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-semibold">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.category ?? "Uncategorised"} · stock {product.stock}
                  </p>
                </div>
                <span className="font-display font-bold">{formatBDT(product.price)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${product.name}`}
                  onClick={() => edit(product)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  aria-label={`Delete ${product.name}`}
                  onClick={() => remove(product)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
            {!products?.length ? (
              <li className="p-6 text-center text-sm text-muted-foreground">No products yet.</li>
            ) : null}
          </ul>
        )}
      </div>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="d-name">Name</Label>
                <Input
                  id="d-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="d-price">Price (BDT)</Label>
                  <Input
                    id="d-price"
                    inputMode="numeric"
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="d-stock">Stock</Label>
                  <Input
                    id="d-stock"
                    inputMode="numeric"
                    value={draft.stock}
                    onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="d-category">Category</Label>
                <select
                  id="d-category"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Uncategorised</option>
                  {(categories ?? []).map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="d-desc">Description</Label>
                <Textarea
                  id="d-desc"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="d-image">Image</Label>
                <div className="flex items-center gap-3">
                  <ProductImage
                    src={draft.image}
                    alt={draft.name || "Product"}
                    className="size-16 rounded-xl"
                  />
                  <Input
                    id="d-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => pickImage(e.target.files?.[0])}
                  />
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4 text-muted-foreground" />}
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button variant="hero" disabled={saving || uploading} onClick={save}>
              {saving ? <Loader2 className="animate-spin" /> : null} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
                }
