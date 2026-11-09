import type { ReactNode } from "react";
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
  accessory,
}: {
  item: ItemView;
  index: number;
  onOpen: () => void;
  onEdit: () => void;
  accessory?: ReactNode;
}) {
  const { isEditor } = useEditAuth();
  const cover = item.images[0];
  const activate = isEditor ? onEdit : onOpen;

  const article = (
    <article
      data-testid={`card-item-${item.id}`}
      onClick={activate}
      className={cn(
        "eed-row eed-lift eed-row-glass group grid grid-cols-[84px_minmax(0,1fr)] items-center gap-[21px] px-[21px] py-[18px] sm:grid-cols-[108px_minmax(0,1fr)_165px_72px]",
        "focus-visible:outline-none focus-visible:border-[hsl(var(--hud2))]",
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

      <div className="eed-thumb relative h-14 w-[84px] shrink-0 overflow-hidden bg-secondary/40 sm:h-[72px] sm:w-[108px]">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            data-testid={`text-item-title-${item.id}`}
            className="truncate text-[26px] font-semibold leading-snug text-foreground"
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
              <Pencil className="h-[21px] w-[21px]" />
            </button>
          )}
        </div>
        {item.meta && (
          <p className="mt-1 font-mono text-[20px] text-muted-foreground">{item.meta}</p>
        )}
        {item.description && (
          <p className="mt-1.5 hidden max-w-[52ch] truncate text-[21px] text-muted-foreground sm:block">
            {item.description.replace(/\n/g, " ")}
          </p>
        )}
      </div>

      <div className="hidden justify-self-end sm:block">
        <StatusBadge status={item.status} className="rounded-none bg-[rgba(8,24,48,0.35)] px-3 py-1.5 font-mono text-[18px]" />
      </div>

      <div className="hidden items-center justify-end gap-2 font-mono text-[20px] text-muted-foreground sm:flex">
        {item.images.length > 0 && <span>×{item.images.length}</span>}
        {item.audioUrl && <Music className="h-[21px] w-[21px] text-primary" />}
        {item.videoUrl && <Video className="h-[21px] w-[21px] text-primary" />}
        {item.attachmentUrl && <Paperclip className="h-[21px] w-[21px] text-primary" />}
      </div>

      <div className="col-span-2 flex items-center justify-between gap-2 sm:hidden">
        <StatusBadge status={item.status} className="rounded-none bg-[rgba(8,24,48,0.35)] px-3 py-1.5 font-mono text-[18px]" />
        {item.images.length > 0 && (
          <span className="font-mono text-[20px] text-muted-foreground">×{item.images.length}</span>
        )}
      </div>
    </article>
  );

  return (
    <div
      className="eed-float"
      style={{ animationDelay: `${0.2 + (index % 4) * 0.4}s`, animationDuration: "4s" }}
    >
      {accessory ? (
        <div className="flex items-center gap-3">
          {accessory}
          <div className="min-w-0 flex-1">{article}</div>
        </div>
      ) : (
        article
      )}
    </div>
  );
}
