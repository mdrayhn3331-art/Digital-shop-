import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, uploadShopImage, type AppSettings } from "@/lib/shop";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const queryClient = useQueryClient();
  const { data } = useQuery(settingsQuery);
  const [form, setForm] = useState<Partial<AppSettings>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function upload(kind: "logo" | "banner", file: File | undefined) {
    if (!file) return;
    setUploading(kind);
    try {
      const url = await uploadShopImage(file, kind);
      set(kind, url);
      toast.success(`${kind === "logo" ? "Logo" : "Banner"} uploaded`);
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    if (!data?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({
        app_name: form.app_name ?? "Digital Shop",
        logo: form.logo ?? null,
        banner: form.banner ?? null,
        bkash_number: form.bkash_number ?? null,
        nagad_number: form.nagad_number ?? null,
        delivery_charge: Number(form.delivery_charge ?? 0),
        contact_phone: form.contact_phone ?? null,
        contact_email: form.contact_email ?? null,
        contact_address: form.contact_address ?? null,
      })
      .eq("id", data.id);
    setSaving(false);
    if (error) {
      toast.error("Could not save settings", { description: error.message });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["app_settings"] });
    toast.success("Settings saved");
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Shop settings</h1>

      <div className="mt-4 grid max-w-2xl gap-4">
        <section className="grid gap-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="font-display text-lg font-bold">Branding</h2>
          <div className="grid gap-1.5">
            <Label htmlFor="s-name">App name</Label>
            <Input
              id="s-name"
              value={form.app_name ?? ""}
              onChange={(e) => set("app_name", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-logo">Logo image</Label>
            <div className="flex items-center gap-3">
              {form.logo ? (
                <img src={form.logo} alt="Shop logo" className="size-12 rounded-xl object-cover" />
              ) : null}
              <Input
                id="s-logo"
                type="file"
                accept="image/*"
                onChange={(e) => upload("logo", e.target.files?.[0])}
              />
              {uploading === "logo" ? <Loader2 className="size-4 animate-spin" /> : null}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-banner">Home banner</Label>
            <div className="flex items-center gap-3">
              {form.banner ? (
                <img
                  src={form.banner}
                  alt="Home banner"
                  className="h-12 w-24 rounded-xl object-cover"
                />
              ) : null}
              <Input
                id="s-banner"
                type="file"
                accept="image/*"
                onChange={(e) => upload("banner", e.target.files?.[0])}
              />
              {uploading === "banner" ? <Loader2 className="size-4 animate-spin" /> : null}
            </div>
          </div>
        </section>

        <section className="grid gap-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="font-display text-lg font-bold">Payments & delivery</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="s-bkash">bKash number</Label>
              <Input
                id="s-bkash"
                inputMode="tel"
                value={form.bkash_number ?? ""}
                onChange={(e) => set("bkash_number", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s-nagad">Nagad number</Label>
              <Input
                id="s-nagad"
                inputMode="tel"
                value={form.nagad_number ?? ""}
                onChange={(e) => set("nagad_number", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-delivery">Delivery charge (BDT)</Label>
            <Input
              id="s-delivery"
              inputMode="numeric"
              value={String(form.delivery_charge ?? "")}
              onChange={(e) => set("delivery_charge", Number(e.target.value || 0))}
            />
          </div>
        </section>

        <section className="grid gap-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="font-display text-lg font-bold">Contact</h2>
          <div className="grid gap-1.5">
            <Label htmlFor="s-phone">Phone</Label>
            <Input
              id="s-phone"
              value={form.contact_phone ?? ""}
              onChange={(e) => set("contact_phone", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-email">Email</Label>
            <Input
              id="s-email"
              type="email"
              value={form.contact_email ?? ""}
              onChange={(e) => set("contact_email", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-address">Address</Label>
            <Input
              id="s-address"
              value={form.contact_address ?? ""}
              onChange={(e) => set("contact_address", e.target.value)}
            />
          </div>
        </section>

        <Button variant="hero" size="lg" disabled={saving} onClick={save}>
          {saving ? <Loader2 className="animate-spin" /> : null} Save settings
        </Button>
      </div>
    </div>
  );
      }
