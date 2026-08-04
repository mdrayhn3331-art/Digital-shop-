import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Truck, Wallet } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import { AppShell } from "@/components/shop/AppShell";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoriesQuery, productsQuery, settingsQuery } from "@/lib/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Digital Shop — Gadgets, Audio & Accessories in Bangladesh" },
      {
        name: "description",
        content:
          "Shop smartphones, laptops, audio gear, smart watches and accessories at Digital Shop. bKash, Nagad and cash on delivery supported.",
      },
      { property: "og:title", content: "Digital Shop — Gadgets, Audio & Accessories" },
      {
        property: "og:description",
        content: "Smartphones, laptops, audio and accessories with fast nationwide delivery.",
      },
    ],
  }),
  component: HomePage,
});

const perks = [
  { icon: Truck, title: "Fast delivery", text: "Nationwide, 1–3 days" },
  { icon: Wallet, title: "bKash & Nagad", text: "Or cash on delivery" },
  { icon: BadgeCheck, title: "Genuine products", text: "Warranty on every item" },
];

function HomePage() {
  const { data: settings } = useQuery(settingsQuery);
  const { data: categories } = useQuery(categoriesQuery);
  const { data: products, isLoading } = useQuery(productsQuery());

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl border border-border">
        <img
          src={settings?.banner || heroBanner}
          alt="Featured gadgets at Digital Shop"
          width={1600}
          height={912}
          className="h-64 w-full object-cover sm:h-80 md:h-96"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center gap-4 p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            {settings?.app_name || "Digital Shop"}
          </p>
          <h1 className="max-w-md font-display text-3xl font-bold leading-tight sm:text-5xl">
            Tech that keeps up <span className="text-gradient-brand">with you</span>
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground sm:text-base">
            Phones, laptops, audio and accessories — delivered anywhere in Bangladesh.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="hero" size="lg" asChild>
              <Link to="/products">
                Shop now <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {perks.map((perk) => (
          <div
            key={perk.title}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 p-4"
          >
            <span className="grid size-10 place-items-center rounded-xl gradient-brand text-primary-foreground">
              <perk.icon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{perk.title}</p>
              <p className="text-xs text-muted-foreground">{perk.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl font-bold">Categories</h2>
          <Link to="/products" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {(categories ?? []).map((category) => (
            <Link
              key={category.id}
              to="/products"
              search={{ category: category.name, q: undefined }}
              className="card-hover shrink-0 rounded-2xl border border-border bg-card px-5 py-4 text-sm font-semibold"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl font-bold">Latest products</h2>
          <Link to="/products" className="text-sm text-primary hover:underline">
            Browse shop
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-64 rounded-2xl" />
              ))
            : (products ?? [])
                .slice(0, 8)
                .map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>
    </AppShell>
  );
}
