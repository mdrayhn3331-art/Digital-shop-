import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/shop/ProductImage";
import { useCart } from "@/lib/cart";
import { formatBDT, type Product } from "@/lib/shop";

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const outOfStock = product.stock <= 0;

  return (
    <div className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="relative block aspect-square overflow-hidden"
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        {outOfStock ? (
          <Badge variant="destructive" className="absolute left-2 top-2">
            Out of stock
          </Badge>
        ) : product.stock <= 5 ? (
          <Badge className="absolute left-2 top-2 bg-warning text-warning-foreground">
            Only {product.stock} left
          </Badge>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {product.category ? (
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {product.category}
          </span>
        ) : null}
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="line-clamp-2 text-sm font-semibold leading-snug hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="font-display text-lg font-bold text-gradient-brand">
            {formatBDT(product.price)}
          </span>
          <Button
            size="icon"
            variant="hero"
            aria-label={`Add ${product.name} to cart`}
            disabled={outOfStock}
            onClick={() => {
              cart.add(product);
              toast.success("Added to cart", { description: product.name });
            }}
          >
            <ShoppingCart />
          </Button>
        </div>
      </div>
    </div>
  );
}
