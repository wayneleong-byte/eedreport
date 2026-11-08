import { useState, useEffect, useCallback } from "react";
import type { ItemView } from "@shared/schema";
import { StatusBadge } from "./StatusBadge";
import { AUDIO_PLACEHOLDER, IMAGE_PLACEHOLDER } from "@/lib/report";
import { X, Music, Video as VideoIcon, Paperclip, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

function toEmbed(url: string): string | null {
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

function safeHref(url: string): string {
  try {
    const u = new URL(url, window.location.href);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : "#";
  } catch {
    return "#";
  }
}

export function ItemModal({
  item,
  onClose,
}: {
  item: ItemView | null;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState<number | null>(null);
  const total = item?.images.length ?? 0;
  const step = useCallback(
    (d: number) => setZoom((z) => (z === null || total === 0 ? z : (z + d + total) % total)),
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (zoom !== null) {
        if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
        else if (e.key === "Escape") { e.preventDefault(); setZoom(null); }
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, step, onClose]);

  if (!item) return null;

  const embed = item.videoUrl ? toEmbed(item.videoUrl) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur-md sm:p-8"
      data-testid="modal-item"
      onClick={onClose}
    >
      <div
        className="relative my-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-card-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-secondary/40 px-6 py-5 sm:px-8">
          <div className="min-w-0 space-y-2">
            {item.meta && (
              <p className="font-mono text-sm text-primary">{item.meta}</p>
            )}
            <h2
              data-testid="text-modal-title"
              className="font-serif text-2xl font-bold leading-tight text-card-foreground sm:text-3xl"
            >
              {item.title}
            </h2>
            <StatusBadge status={item.status} size="lg" />
          </div>
          <button
            data-testid="button-close-modal"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-border bg-background/60 p-2 text-muted-foreground hover-elevate"
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-7 px-6 py-7 sm:px-8 sm:py-8">
          {/* description */}
          {item.description ? (
            <p
              data-testid="text-modal-description"
              className="max-w-none whitespace-pre-line break-words text-lg leading-relaxed text-card-foreground/90"
            >
              {item.description}
            </p>
          ) : null}

          {/* images */}
          <section className="space-y-3">
            <SectionLabel>相片 · IMAGES</SectionLabel>
            {item.images.length > 0 ? (
              <div className={`grid grid-cols-2 gap-3 ${item.images.length > 4 ? "sm:grid-cols-3 lg:grid-cols-4" : ""}`}>
                {item.images.map((src, i) => (
                  <button
                    key={i}
                    data-testid={`button-zoom-image-${i}`}
                    onClick={() => setZoom(i)}
                    className="group overflow-hidden rounded-lg border border-border"
                    aria-label={`放大圖片 ${i + 1}`}
                  >
                    <img
                      src={src}
                      alt={`${item.title} 圖片 ${i + 1}`}
                      className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <Placeholder>{IMAGE_PLACEHOLDER}</Placeholder>
            )}
          </section>

          {/* audio */}
          <section className="space-y-3">
            <SectionLabel>
              <Music className="mr-1.5 inline h-3.5 w-3.5" />
              聲音 · AUDIO
            </SectionLabel>
            {item.audioUrl ? (
              <audio
                data-testid="audio-player"
                controls
                src={item.audioUrl}
                className="w-full"
              />
            ) : (
              <Placeholder>{AUDIO_PLACEHOLDER}</Placeholder>
            )}
          </section>

          {/* video */}
          {item.videoUrl && (
            <section className="space-y-3">
              <SectionLabel>
                <VideoIcon className="mr-1.5 inline h-3.5 w-3.5" />
                影片 · VIDEO
              </SectionLabel>
              {embed ? (
                <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
                  <iframe
                    data-testid="video-embed"
                    src={embed}
                    title={`${item.title} 影片`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : isDirectVideo(item.videoUrl) ? (
                <video
                  data-testid="video-player"
                  controls
                  src={item.videoUrl}
                  className="w-full rounded-lg border border-border"
                />
              ) : (
                <a
                  data-testid="link-video"
                  href={safeHref(item.videoUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary hover-elevate"
                >
                  <ExternalLink className="h-4 w-4" />
                  開啟影片連結
                </a>
              )}
            </section>
          )}

          {/* attachment */}
          {item.attachmentUrl && (
            <section className="space-y-3">
              <SectionLabel>
                <Paperclip className="mr-1.5 inline h-3.5 w-3.5" />
                附件 · ATTACHMENT
              </SectionLabel>
              <a
                data-testid="link-attachment"
                href={safeHref(item.attachmentUrl)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium text-card-foreground hover-elevate"
              >
                <Paperclip className="h-4 w-4" />
                開啟附件
              </a>
            </section>
          )}
        </div>
      </div>

      {/* image lightbox with prev / next */}
      {zoom !== null && item.images[zoom] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 p-6"
          data-testid="lightbox-image"
          onClick={(e) => {
            e.stopPropagation();
            setZoom(null);
          }}
        >
          <img
            key={zoom}
            src={item.images[zoom]}
            alt={`${item.title} 圖片 ${zoom + 1}`}
            data-testid="img-lightbox"
            className="max-h-[84vh] max-w-[86vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            data-testid="button-close-lightbox"
            className="absolute right-4 top-4 rounded-lg border border-border bg-card/80 p-2 text-foreground transition-colors hover:bg-card hover:border-primary/60 sm:right-6 sm:top-6"
            aria-label="關閉放大圖片"
          >
            <X className="h-6 w-6" />
          </button>
          {total > 1 && (
            <>
              <button
                data-testid="button-prev-image"
                onClick={(e) => { e.stopPropagation(); step(-1); }}
                className="absolute left-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full border border-border bg-card/85 px-3 py-3 text-sm font-medium text-foreground shadow-lg transition-colors hover:bg-card hover:border-primary/60 sm:left-6 sm:px-4"
                aria-label="上一張"
              >
                <ChevronLeft className="h-6 w-6" />
                <span className="hidden sm:inline">上一張</span>
              </button>
              <button
                data-testid="button-next-image"
                onClick={(e) => { e.stopPropagation(); step(1); }}
                className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full border border-border bg-card/85 px-3 py-3 text-sm font-medium text-foreground shadow-lg transition-colors hover:bg-card hover:border-primary/60 sm:right-6 sm:px-4"
                aria-label="下一張"
              >
                <span className="hidden sm:inline">下一張</span>
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div
            data-testid="text-lightbox-counter"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card/85 px-4 py-1.5 font-mono text-sm text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            {zoom + 1} / {total}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </h4>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <p
      data-testid="text-placeholder"
      className="rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-3 text-sm leading-relaxed text-muted-foreground"
    >
      {children}
    </p>
  );
}
