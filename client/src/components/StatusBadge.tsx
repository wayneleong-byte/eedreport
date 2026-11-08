import { cn } from "@/lib/utils";

function tone(status: string): "ready" | "progress" | "live" | "neutral" {
  const s = status.trim();
  if (!s) return "neutral";
  if (/ready|完成|done/i.test(s)) return "ready";
  if (/進行/.test(s)) return "live";
  if (/籌備|準備|跟進|招標/.test(s)) return "progress";
  return "neutral";
}

export function StatusBadge({
  status,
  size = "sm",
  className,
}: {
  status: string;
  size?: "sm" | "lg";
  className?: string;
}) {
  if (!status.trim()) return null;
  const t = tone(status);
  return (
    <span
      data-testid="status-badge"
      className={cn(
        "inline-flex items-center gap-1.5 border font-medium tracking-wide whitespace-nowrap",
        size === "lg" ? "px-3.5 py-1.5 text-base" : "px-2 py-1 text-sm",
        t === "ready" && "border-[hsl(var(--hud2))] text-[hsl(var(--hud2))]",
        t === "progress" && "border-[hsl(var(--amber))] text-[hsl(var(--amber))]",
        t === "live" && "border-primary text-primary eed-status-live",
        t === "neutral" && "border-primary/40 text-primary",
        className,
      )}
    >
      {status}
    </span>
  );
}
