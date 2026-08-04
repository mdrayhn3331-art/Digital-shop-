import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shop/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Digital Shop" },
      {
        name: "description",
        content: "Update your name, phone and delivery address for faster Digital Shop checkouts.",
      },
      { property: "og:title", content: "Your profile — Digital Shop" },
      { property: "og:description", content: "Manage your Digital Shop account details." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!profile) return;
    setName((profile.name as string) ?? "");
    setPhone((profile.phone as string) ?? "");
  }, [profile]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email ?? null,
      name: name.trim(),
      phone: phone.trim(),
    });
    setSaving(false);
    if (error) {
      toast.error("Could not save profile", { description: error.message });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Profile updated");
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">Your profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>

      {isAdmin ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/40 bg-secondary/40 p-3 text-sm">
          <ShieldCheck className="size-4 text-primary" />
          You have admin access to this shop.
        </div>
      ) : null}

      <div className="mt-4 grid max-w-lg gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-1.5">
          <Label htmlFor="p-name">Full name</Label>
          <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="p-phone">Phone</Label>
          <Input
            id="p-phone"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <Button variant="hero" disabled={saving} onClick={save}>
          {saving ? <Loader2 className="animate-spin" /> : null} Save changes
        </Button>
      </div>

      <Button variant="outline" className="mt-4" onClick={signOut}>
        <LogOut /> Sign out
      </Button>
    </AppShell>
  );
      }
