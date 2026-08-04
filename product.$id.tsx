import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shop/AppShell";
import { ProductImage } from "@/components/shop/ProductImage";
import { ProductCard } from "@/components/shop/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart";
import { formatBDT, productQuery, productsQuery } from "@/lib/shop";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product details — Digital Shop" },
      {
        name: "description",
        content: "See full specs, price and stock for this Digital Shop product before you buy.",
      },
      { property: "og:title", content: "Product details — Digital Shop" },
      {
        property: "og:description",
        content: "Specs, price and availability for this Digital Shop product.",
      },
    ],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const [qty, setQty] = useState(1);
  const { data: product, isLoading } = useQuery(productQuery(id));
  const { data: related } = useQuery(productsQuery({ category: product?.category ?? undefined }));

  if (isLoading) {
    return (
      <AppShell>
        <Skeleton className="h-80 rounded-3xl" />
        <Skeleton className="mt-4 h-8 w-2/3" />
        <Skeleton className="mt-2 h-24" />
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <h1 className="font-display text-xl font-bold">Product not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This product may have been removed from the shop.
          </p>
          <Button variant="hero" className="mt-4" asChild>
            <Link to="/products">Back to shop</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <AppShell>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={() => navigate({ to: "/products" })}>
        <ChevronLeft /> Back to shop
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <ProductImage
            src={product.image}
            alt={product.name}
            loading="eager"
            className="aspect-square h-full w-full"
          />
        </div>

        <div>
          {product.category ? (
            <Link
              to="/products"
              search={{ category: product.category, q: undefined }}
              className="text-xs uppercase tracking-widest text-primary hover:underline"
            >
              {product.category}
            </Link>
          ) : null}
          <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{product.name}</h1>
          <p className="mt-3 font-display text-3xl font-bold text-gradient-brand">
            {formatBDT(product.price)}
          </p>
          <div className="mt-2">
            {outOfStock ? (
              <Badge variant="destructive">Out of stock</Badge>
            ) : (
              <Badge className="bg-success text-success-foreground">
                In stock · {product.stock} available
              </Badge>
            )}
          </div>

          {product.description ? (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          ) : null}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/50 p-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Decrease quantity"
                onClick={() => setQty((value) => Math.max(1, value - 1))}
              >
                <Minus />
              </Button>
              <span className="w-8 text-center text-sm font-semibold">{qty}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Increase quantity"
                onClick={() => setQty((value) => Math.min(product.stock || 1, value + 1))}
              >
                <Plus />
              </Button>
            </div>
            <Button
              variant="hero"
              size="lg"
              className="flex-1"
              disabled={outOfStock}
              onClick={() => {
                cart.add(product, qty);
                toast.success("Added to cart", { description: `${qty} × ${product.name}` });
              }}
            >
              <ShoppingCart /> Add to cart
            </Button>
          </div>

          <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Truck className="size-4 text-primary" /> Delivery in 1–3 days nationwide
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> bKash, Nagad or cash on delivery
            </p>
          </div>
        </div>
      </div>

      {(related ?? []).filter((item) => item.id !== product.id).length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-xl font-bold">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(related ?? [])
              .filter((item) => item.id !== product.id)
              .slice(0, 4)
              .map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
