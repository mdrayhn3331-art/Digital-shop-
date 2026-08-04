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
