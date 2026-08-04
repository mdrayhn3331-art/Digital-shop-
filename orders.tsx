import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch } from "lucide-react";
import { AppShell } from "@/components/shop/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatBDT, formatDate, paymentLabel, type Order } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "Your orders — Digital Shop" },
      {
        name: "description",
        content: "Track the status of every order you have placed with Digital Shop.",
      },
      { property: "og:title", content: "Your orders — Digital Shop" },
      { property: "og:description", content: "Track your Digital Shop order status." },
    ],
  }),
  component: OrdersPage,
});

const statusTone: Record<string, string> = {
  pending: "bg-secondary text-secondary-foreground",
  confirmed: "bg-primary/20 text-primary",
  processing: "bg-primary/20 text-primary",
  shipped: "bg-accent/20 text-accent",
  delivered: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
};

function OrdersPage() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Order[];
    },
  });

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">Your orders</h1>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : !orders?.length ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/60 p-10 text-center">
          <PackageSearch className="size-8 text-muted-foreground" />
          <p className="font-semibold">No orders yet</p>
          <Button variant="hero" asChild>
            <Link to="/products">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display font-bold">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
                <Badge className={statusTone[order.order_status] ?? "bg-secondary"}>
                  {order.order_status}
                </Badge>
              </div>

              <ul className="mt-3 space-y-1 text-sm">
                {order.products?.map((item, index) => (
                  <li key={`${order.id}-${index}`} className="flex justify-between gap-2">
                    <span className="line-clamp-1 text-muted-foreground">
                      {item.qty} × {item.name}
                    </span>
                    <span>{formatBDT(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">
                  {paymentLabel(order.payment_method)} · payment {order.payment_status}
                </span>
                <span className="font-display text-base font-bold">
                  {formatBDT(order.total_price)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
                }
