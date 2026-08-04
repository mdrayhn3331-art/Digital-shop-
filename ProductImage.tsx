import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  className,
  loading = "lazy",
}: {
  src: string | null;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-secondary/60 text-3xl font-display font-bold text-muted-foreground",
          className,
        )}
        aria-label={alt}
        role="img"
      >
        {alt.slice(0, 1).toUpperCase()}
      </div>
    );
  }
  return (
    <img src={src} alt={alt} loading={loading} className={cn("object-cover", className)} />
  );
}
