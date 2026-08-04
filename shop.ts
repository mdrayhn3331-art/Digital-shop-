import { supabase } from "@/integrations/supabase/client";

/**
 * The ONLY email allowed into the admin panel. UI checks are cosmetic —
 * the database enforces this with the is_admin() function inside every
 * admin RLS policy, so a tampered client still cannot read or write.
 */
export const ADMIN_EMAIL = "mdrayhn3331@gmail.com";

export type Product = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  description: string | null;
  category: string | null;
  stock: number;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  image: string | null;
};

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image: string | null;
};

export type Order = {
  id: string;
  user_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  products: OrderItem[];
  delivery_charge: number;
  total_price: number;
  payment_method: string;
  payment_number: string | null;
  payment_txn: string | null;
  payment_status: string;
  order_status: string;
  created_at: string;
};

export type AppSettings = {
  id: string;
  app_name: string;
  logo: string | null;
  banner: string | null;
  bkash_number: string | null;
  nagad_number: string | null;
  delivery_charge: number;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

export const PAYMENT_METHODS = [
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "cod", label: "Cash on Delivery" },
] as const;

export function paymentLabel(method: string) {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}

export function formatBDT(amount: number) {
  return `\u09F3${Number(amount || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ---------------------------------- queries --------------------------------- */

export const settingsQuery = {
  queryKey: ["app_settings"],
  queryFn: async (): Promise<AppSettings | null> => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as AppSettings | null) ?? null;
  },
};

export const categoriesQuery = {
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, image")
      .order("name");
    if (error) throw error;
    return (data ?? []) as Category[];
  },
};

export function productsQuery(
  opts: { search?: string | undefined; category?: string | undefined } = {},
) {
  return {
    queryKey: ["products", opts.search ?? "", opts.category ?? ""],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase.from("products").select("*");
      if (opts.category) query = query.eq("category", opts.category);
      if (opts.search) query = query.ilike("name", `%${opts.search}%`);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  };
}

export function productQuery(id: string) {
  return {
    queryKey: ["product", id],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as Product | null) ?? null;
    },
  };
}

/** Uploads to the private `shop` bucket and returns a long-lived signed URL. */
export async function uploadShopImage(file: File, folder = "products") {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("shop").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from("shop")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signError) throw signError;
  return data.signedUrl;
  }
