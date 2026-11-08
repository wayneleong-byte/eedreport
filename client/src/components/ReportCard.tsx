import type { ItemView } from "@shared/schema";
import { StatusBadge } from "./StatusBadge";
import { ImageIcon, Music, Video, Paperclip, Pencil } from "lucide-react";
import { useEditAuth } from "@/lib/report";
import { cn } from "@/lib/utils";

export function ReportCard({
  item,
  index,
  onOpen,
  onEdit,
  onLock,
  onUnlock,
}: {
  item: ItemView;
  index: number;
  onOpen: () => void;
  onEdit: () => void;
  onLock?: (el: HTMLElement) => void;
  onUnlock?: () => void;
}) {
  const { isEditor } = useEditAuth();
  const cover = item.images[0];
  const activate = isEditor ? onEdit : onOpen;

  return (
    <article
      data-testid={`card-item-${item.id}`}
      onClick={activate}
      onMouseEnter={(e) => onLock?.(e.currentTarget)}
      onMouseLeave={() => onUnlock?.()}
      onFocus={(e) => onLock?.(e.currentTarget)}
      onBlur={() => onUnlock?.()}
      className={cn(
        "eed-row group grid cursor-pointer grid-cols-[72px_1fr] items-center gap-3 border border-primary/20 bg-[#050e0c] px-3 py-2.5 transition-[border-color,background,box-shadow] duration-200 sm:grid-cols-[72px_1fr_110px_48px] sm:gap-3.5",
        "hover:border-primary hover:bg-[#0a1814] hover:shadow-[0_0_20px_hsl(158_100%_50%/0.12)]",
        "focus-visible:border-primary focus-visible:outline-none",
      )}
      style={{ animationDelay: `${0.12 + index * 0.08}s` }}
      tabIndex={0}
      role="button"
      aria-label={isEditor ? `編輯 ${item.title}` : `開啟 ${item.title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      }}
    >
      <div className="eed-row-sweep" aria-hidden />

      <div className="relative h-12 w-[72px] shrink-0 overflow-hidden border border-primary/30 bg-secondary/40">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            data-testid={`text-item-title-${item.id}`}
            className="truncate text-[15px] font-semibold leading-snug text-foreground"
          >
            {item.title}
          </h3>
          {isEditor && (
            <button
              data-testid={`button-edit-item-${item.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="shrink-0 border border-border p-1 text-muted-foreground hover:text-primary"
              aria-label="編輯項目"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {item.meta && (
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{item.meta}</p>
        )}
        {item.description && (
          <p className="mt-1 hidden max-w-[52ch] truncate text-xs text-muted-foreground sm:block">
            {item.description.replace(/\n/g, " ")}
          </p>
        )}
      </div>

      <div className="hidden justify-self-end sm:block">
        <StatusBadge status={item.status} className="rounded-none font-mono text-[10px]" />
      </div>

      <div className="hidden items-center justify-end gap-1.5 font-mono text-[11px] text-muted-foreground sm:flex">
        {item.images.length > 0 && <span>×{item.images.length}</span>}
        {item.audioUrl && <Music className="h-3.5 w-3.5 text-primary" />}
        {item.videoUrl && <Video className="h-3.5 w-3.5 text-primary" />}
        {item.attachmentUrl && <Paperclip className="h-3.5 w-3.5 text-primary" />}
      </div>

      <div className="col-span-2 flex items-center justify-between gap-2 sm:hidden">
        <StatusBadge status={item.status} className="rounded-none font-mono text-[10px]" />
        {item.images.length > 0 && (
          <span className="font-mono text-[11px] text-muted-foreground">×{item.images.length}</span>
        )}
      </div>
    </article>
  );
}
