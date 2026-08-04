import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Copy, Loader2, LogIn, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shop/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/lib/cart";
import { PAYMENT_METHODS, formatBDT, settingsQuery } from "@/lib/shop";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Digital Shop" },
      {
        name: "description",
        content:
          "Confirm your delivery details and pay with bKash, Nagad or cash on delivery at Digital Shop.",
      },
      { property: "og:title", content: "Checkout — Digital Shop" },
      { property: "og:description", content: "Pay with bKash, Nagad or cash on delivery." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: settings } = useQuery(settingsQuery);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState<string>("cod");
  const [txn, setTxn] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setName(data.name as string);
        if (data?.phone) setPhone(data.phone as string);
      });
  }, [user]);

  const delivery = Number(settings?.delivery_charge ?? 0);
  const total = cart.subtotal + (cart.items.length ? delivery : 0);
  const payNumber =
    method === "bkash" ? settings?.bkash_number : method === "nagad" ? settings?.nagad_number : null;

  async function placeOrder() {
    if (!user) return;
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error("Please fill in your name, phone and address");
      return;
    }
    if (method !== "cod" && !txn.trim()) {
      toast.error("Enter the transaction ID from your payment");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_address: address.trim(),
      products: cart.items,
      delivery_charge: delivery,
      total_price: total,
      payment_method: method,
      payment_number: payNumber ?? null,
      payment_txn: method === "cod" ? null : txn.trim(),
      payment_status: "pending",
      order_status: "pending",
    });
    setSaving(false);

    if (error) {
      toast.error("Could not place order", { description: error.message });
      return;
    }
    cart.clear();
    toast.success("Order placed!", { description: "We'll confirm it shortly." });
    navigate({ to: "/orders" });
  }

  if (!loading && !user) {
    return (
      <AppShell>
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/60 p-10 text-center">
          <LogIn className="size-8 text-muted-foreground" />
          <h1 className="font-display text-xl font-bold">Sign in to check out</h1>
          <p className="text-sm text-muted-foreground">
            Your cart is saved — sign in or create an account to complete the order.
          </p>
          <Button variant="hero" asChild>
            <Link to="/auth">Sign in / Register</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  if (cart.items.length === 0) {
    return (
      <AppShell>
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/60 p-10 text-center">
          <ShoppingBag className="size-8 text-muted-foreground" />
          <h1 className="font-display text-xl font-bold">Nothing to check out</h1>
          <Button variant="hero" asChild>
            <Link to="/products">Browse products</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">Checkout</h1>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-lg font-bold">Delivery details</h2>
            <div className="mt-3 grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="address">Full address</Label>
                <Textarea
                  id="address"
                  rows={3}
                  placeholder="House, road, area, city"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-lg font-bold">Payment method</h2>
            <RadioGroup value={method} onValueChange={setMethod} className="mt-3 grid gap-2">
              {PAYMENT_METHODS.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3 text-sm font-medium has-[button[data-state=checked]]:border-primary"
                >
                  <RadioGroupItem id={option.value} value={option.value} />
                  {option.label}
                </Label>
              ))}
            </RadioGroup>

            {method !== "cod" ? (
              <div className="mt-4 space-y-3 rounded-xl border border-primary/40 bg-secondary/40 p-3">
                <p className="text-sm">
                  Send <strong>{formatBDT(total)}</strong> to this{" "}
                  {method === "bkash" ? "bKash" : "Nagad"} number, then enter the transaction ID:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-background px-3 py-2 font-display text-lg font-bold tracking-wide">
                    {payNumber ?? "—"}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Copy payment number"
                    onClick={() => {
                      navigator.clipboard.writeText(payNumber ?? "");
                      toast.success("Number copied");
                    }}
                  >
                    <Copy />
                  </Button>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="txn">Transaction ID</Label>
                  <Input id="txn" value={txn} onChange={(e) => setTxn(e.target.value)} />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Pay in cash when your order arrives at your door.
              </p>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span className="line-clamp-1 text-muted-foreground">
                  {item.qty} × {item.name}
                </span>
                <span>{formatBDT(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
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
              <dd className="text-gradient-brand">{formatBDT(total)}</dd>
            </div>
          </dl>
          <Button
            variant="hero"
            size="lg"
            className="mt-4 w-full"
            disabled={saving}
            onClick={placeOrder}
          >
            {saving ? <Loader2 className="animate-spin" /> : null}
            Place order
          </Button>
        </aside>
      </div>
    </AppShell>
  );
}
