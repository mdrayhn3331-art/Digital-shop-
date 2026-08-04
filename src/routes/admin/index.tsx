import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Receipt, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT, formatDate, type Order } from "@/lib/shop";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [orders, products, customers] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      if (orders.error) throw orders.error;
      const list = (orders.data ?? []) as unknown as Order[];
      return {
        orders: list,
        revenue: list
          .filter((o) => o.order_status !== "cancelled")
          .reduce((sum, o) => sum + Number(o.total_price), 0),
        productCount: products.count ?? 0,
        customerCount: customers.count ?? 0,
      };
    },
  });

  const cards = [
    { label: "Revenue", value: formatBDT(data?.revenue ?? 0), icon: TrendingUp },
    { label: "Orders", value: String(data?.orders.length ?? 0), icon: Receipt },
    { label: "Products", value: String(data?.productCount ?? 0), icon: Package },
    { label: "Customers", value: String(data?.customerCount ?? 0), icon: Users },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className="size-4 text-primary" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-lg font-bold">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {(data?.orders ?? []).slice(0, 8).map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <p className="font-semibold">{order.customer_name ?? "Customer"}</p>
                <p className="text-xs text-muted-foreground">
                  #{order.id.slice(0, 8).toUpperCase()} · {formatDate(order.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{order.order_status}</Badge>
                <span className="font-display font-bold">{formatBDT(order.total_price)}</span>
              </div>
            </li>
          ))}
          {!data?.orders.length ? (
            <li className="p-6 text-center text-sm text-muted-foreground">No orders yet.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
