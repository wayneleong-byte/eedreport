import { useState, useEffect } from "react";
import type { ItemView, Section } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { authHeaders, useEditAuth } from "@/lib/report";
import { useToast } from "@/hooks/use-toast";
import { X, Trash2, Plus, Save } from "lucide-react";

const MAX_IMAGES = 8;

interface EditorState {
  sectionId: number;
  title: string;
  meta: string;
  description: string;
  status: string;
  images: string[];
  audioUrl: string;
  videoUrl: string;
  attachmentUrl: string;
}

export function ItemEditor({
  item,
  sections,
  defaultSectionId,
  onClose,
}: {
  item: ItemView | null; // null = create new
  sections: Section[];
  defaultSectionId: number;
  onClose: () => void;
}) {
  const { secret } = useEditAuth();
  const { toast } = useToast();
  const isNew = !item;

  const [state, setState] = useState<EditorState>({
    sectionId: item?.sectionId ?? defaultSectionId,
    title: item?.title ?? "",
    meta: item?.meta ?? "",
    description: item?.description ?? "",
    status: item?.status ?? "",
    images: item ? [...item.images] : [],
    audioUrl: item?.audioUrl ?? "",
    videoUrl: item?.videoUrl ?? "",
    attachmentUrl: item?.attachmentUrl ?? "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  function setField<K extends keyof EditorState>(k: K, v: EditorState[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  function setImage(idx: number, v: string) {
    setState((s) => {
      const imgs = [...s.images];
      imgs[idx] = v;
      return { ...s, images: imgs };
    });
  }
  function addImage() {
    setState((s) => (s.images.length < MAX_IMAGES ? { ...s, images: [...s.images, ""] } : s));
  }
  function removeImage(idx: number) {
    setState((s) => ({ ...s, images: s.images.filter((_, i) => i !== idx) }));
  }

  async function save() {
    if (!state.title.trim()) {
      toast({ title: "請填寫標題", variant: "destructive" });
      return;
    }
    setSaving(true);
    const body = {
      sectionId: state.sectionId,
      title: state.title,
      meta: state.meta,
      description: state.description,
      status: state.status,
      images: state.images.map((i) => i.trim()).filter(Boolean).slice(0, MAX_IMAGES),
      audioUrl: state.audioUrl.trim(),
      videoUrl: state.videoUrl.trim(),
      attachmentUrl: state.attachmentUrl.trim(),
    };
    try {
      if (isNew) {
        await apiRequest("POST", "/api/items", body, authHeaders(secret));
      } else {
        await apiRequest("PATCH", `/api/items/${item!.id}`, body, authHeaders(secret));
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/report"] });
      toast({ title: isNew ? "已新增項目" : "已更新項目" });
      onClose();
    } catch (e: any) {
      toast({ title: "儲存失敗", description: String(e.message ?? e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!item) return;
    if (!window.confirm(`確定刪除「${item.title}」？`)) return;
    setSaving(true);
    try {
      await apiRequest("DELETE", `/api/items/${item.id}`, undefined, authHeaders(secret));
      await queryClient.invalidateQueries({ queryKey: ["/api/report"] });
      toast({ title: "已刪除項目" });
      onClose();
    } catch (e: any) {
      toast({ title: "刪除失敗", description: String(e.message ?? e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur-md sm:p-8"
      data-testid="modal-editor"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-2xl rounded-2xl border border-card-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4">
          <h2 className="font-serif text-xl font-bold text-card-foreground">
            {isNew ? "新增報告項目" : "編輯報告項目"}
          </h2>
          <button
            data-testid="button-close-editor"
            onClick={onClose}
            className="rounded-lg border border-border p-2 text-muted-foreground hover-elevate"
            aria-label="關閉編輯器"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <Field label="所屬區段 SECTION">
            <select
              data-testid="select-section"
              value={state.sectionId}
              onChange={(e) => setField("sectionId", Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} {s.anchor ? `/ ${s.anchor}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="標題 TITLE">
            <Input testid="input-title" value={state.title} onChange={(v) => setField("title", v)} />
          </Field>

          <Field label="副標題 / 日期 / 狀態行 META">
            <Input testid="input-meta" value={state.meta} onChange={(v) => setField("meta", v)} placeholder="例如：2026 H3" />
          </Field>

          <Field label="說明 DESCRIPTION">
            <textarea
              data-testid="input-description"
              value={state.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed"
            />
          </Field>

          <Field label="狀態標籤 STATUS">
            <Input testid="input-status" value={state.status} onChange={(v) => setField("status", v)} placeholder="例如：READY / 籌備中" />
          </Field>

          <Field label="圖片網址 IMAGES（最多 8 張）">
            <div className="space-y-2">
              {state.images.map((img, i) => (
                <div key={i} className="flex gap-2">
                  <Input testid={`input-image-${i}`} value={img} onChange={(v) => setImage(i, v)} placeholder="https://…" />
                  <button
                    data-testid={`button-remove-image-${i}`}
                    onClick={() => removeImage(i)}
                    className="rounded-lg border border-border px-2 text-muted-foreground hover-elevate"
                    aria-label="移除圖片"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {state.images.length < MAX_IMAGES && (
                <button
                  data-testid="button-add-image"
                  onClick={addImage}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover-elevate"
                >
                  <Plus className="h-4 w-4" /> 新增圖片網址（{state.images.length}/{MAX_IMAGES}）
                </button>
              )}
            </div>
          </Field>

          <Field label="聲音檔網址 MP3">
            <Input testid="input-audio" value={state.audioUrl} onChange={(v) => setField("audioUrl", v)} placeholder="https://….mp3" />
          </Field>

          <Field label="影片網址 VIDEO（YouTube / Vimeo / MP4 / 連結）">
            <Input testid="input-video" value={state.videoUrl} onChange={(v) => setField("videoUrl", v)} placeholder="https://…" />
          </Field>

          <Field label="附件網址 ATTACHMENT">
            <Input testid="input-attachment" value={state.attachmentUrl} onChange={(v) => setField("attachmentUrl", v)} placeholder="https://…" />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/70 px-6 py-4">
          {!isNew ? (
            <button
              data-testid="button-delete-item"
              onClick={remove}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive hover-elevate disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> 刪除
            </button>
          ) : (
            <span />
          )}
          <button
            data-testid="button-save-item"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover-elevate disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "儲存中…" : "儲存"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  testid,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  testid?: string;
}) {
  return (
    <input
      data-testid={testid}
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
    />
  );
}
