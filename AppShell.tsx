import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  Home,
  LayoutGrid,
  LogOut,
  Search,
  Shield,
  ShoppingBag,
  ShoppingCart,
  User as UserIcon,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/lib/cart";
import { settingsQuery } from "@/lib/shop";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/products", label: "Shop", icon: LayoutGrid },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
  { to: "/orders", label: "Orders", icon: ShoppingBag },
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const cart = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const { data: settings } = useQuery(settingsQuery);
  const [term, setTerm] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const appName = settings?.app_name || "Digital Shop";

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    navigate({ to: "/products", search: { q: term || undefined, category: undefined } });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass-panel sticky top-0 z-40">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <img
              src={settings?.logo || logo}
              alt={`${appName} logo`}
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-contain"
            />
            <span className="hidden font-display text-lg font-bold sm:block">{appName}</span>
          </Link>

          <form onSubmit={submitSearch} className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="h-10 rounded-xl border-border bg-secondary/60 pl-9"
            />
          </form>

          <Link to="/cart" className="relative" aria-label="Cart">
            <Button variant="ghost" size="icon">
              <ShoppingCart />
            </Button>
            {cart.count > 0 ? (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {cart.count}
              </span>
            ) : null}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <UserIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  <UserIcon /> My profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/orders" })}>
                  <ShoppingBag /> My orders
                </DropdownMenuItem>
                {isAdmin ? (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <Shield /> Admin panel
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/", replace: true });
                  }}
                >
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="hero" size="sm" onClick={() => navigate({ to: "/auth" })}>
              Sign in
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 md:pb-12">{children}</main>

      <footer className="mt-auto hidden border-t border-border bg-surface/50 md:block">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground">
          <p className="font-display text-base font-semibold text-foreground">{appName}</p>
          {settings?.contact_phone ? <p>Phone: {settings.contact_phone}</p> : null}
          {settings?.contact_email ? <p>Email: {settings.contact_email}</p> : null}
          {settings?.contact_address ? <p>{settings.contact_address}</p> : null}
          <p className="pt-2 text-xs">
            Payments: bKash, Nagad and Cash on Delivery. &copy; {new Date().getFullYear()} {appName}
          </p>
        </div>
      </footer>

      <nav className="glass-panel fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5">
          {navItems.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
                {item.to === "/cart" && cart.count > 0 ? (
                  <span className="absolute right-3 top-0 flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                    {cart.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
                      }
