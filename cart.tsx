import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { OrderItem, Product } from "@/lib/shop";

const STORAGE_KEY = "digital-shop-cart";

type CartValue = {
  items: OrderItem[];
  count: number;
  subtotal: number;
  add: (product: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as OrderItem[]);
    } catch {
      /* ignore corrupt cart */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartValue>(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.qty, 0),
      subtotal: items.reduce((sum, item) => sum + item.price * item.qty, 0),
      add: (product, qty = 1) =>
        setItems((current) => {
          const existing = current.find((item) => item.id === product.id);
          if (existing) {
            return current.map((item) =>
              item.id === product.id ? { ...item, qty: item.qty + qty } : item,
            );
          }
          return [
            ...current,
            {
              id: product.id,
              name: product.name,
              price: Number(product.price),
              image: product.image,
              qty,
            },
          ];
        }),
      setQty: (id, qty) =>
        setItems((current) =>
          qty <= 0
            ? current.filter((item) => item.id !== id)
            : current.map((item) => (item.id === id ? { ...item, qty } : item)),
        ),
      remove: (id) => setItems((current) => current.filter((item) => item.id !== id)),
      clear: () => setItems([]),
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/shop/AppShell";
import { ProductImage } from "@/components/shop/ProductImage";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatBDT, settingsQuery } from "@/lib/shop";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — Digital Shop" },
      {
        name: "description",
        content: "Review the items in your Digital Shop cart and continue to checkout.",
      },
      { property: "og:title", content: "Your cart — Digital Shop" },
      { property: "og:description", content: "Review your items and continue to checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const { data: settings } = useQuery(settingsQuery);
  const delivery = cart.items.length ? Number(settings?.delivery_charge ?? 0) : 0;

  return (
  <appshell>
      <h1 className="font-display text-2xl font-bold">Your cart</h1>

      {cart.items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/60 p-10 text-center">
          <ShoppingBag className="size-8 text-muted-foreground" />
          <p className="font-semibold">Your cart is empty</p>
          <p className="text-sm text-muted-foreground">Add a few gadgets to get started.</p>
          <Button variant="hero" asChild>
            <Link to="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <ul className="space-y-3">
            {cart.items.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <Link to="/product/$id" params={{ id: item.id }} className="shrink-0">
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    className="size-20 rounded-xl"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    to="/product/$id"
                    params={{ id: item.id }}
                    className="line-clamp-2 text-sm font-semibold hover:text-primary"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{formatBDT(item.price)}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-lg border border-border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Decrease quantity"
                        onClick={() => cart.setQty(item.id, item.qty - 1)}
                      >
                        <Minus />
                      </Button>
                      <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Increase quantity"
                        onClick={() => cart.setQty(item.id, item.qty + 1)}
                      >
                        <Plus />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatBDT(item.price * item.qty)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => cart.remove(item.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-bold">Order summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatBDT(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd>{formatBDT(delivery)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd className="text-gradient-brand">{formatBDT(cart.subtotal + delivery)}</dd>
              </div>
            </dl>
            <Button variant="hero" size="lg" className="mt-4 w-full" asChild>
              <Link to="/checkout">Proceed to checkout</Link>
            </Button>
            <Button variant="ghost" className="mt-2 w-full" onClick={cart.clear}>
              Clear cart
            </Button>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
