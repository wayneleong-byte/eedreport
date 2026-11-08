import { useState } from "react";
import type { Section } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { authHeaders, useEditAuth } from "@/lib/report";
import { useToast } from "@/hooks/use-toast";
import { X, Trash2, Plus, Save, ArrowUp, ArrowDown } from "lucide-react";

export function SectionEditor({
  sections,
  onClose,
}: {
  sections: Section[];
  onClose: () => void;
}) {
  const { secret } = useEditAuth();
  const { toast } = useToast();
  const [newTitle, setNewTitle] = useState("");
  const [newAnchor, setNewAnchor] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<any>, ok: string) {
    setBusy(true);
    try {
      await fn();
      await queryClient.invalidateQueries({ queryKey: ["/api/report"] });
      toast({ title: ok });
    } catch (e: any) {
      toast({ title: "操作失敗", description: String(e.message ?? e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  // Reorder a section by one slot. Normalizes every section's `position` to its
  // new array index so ordering stays correct even when seed positions collide.
  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const ordered = [...sections];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    await run(
      () =>
        Promise.all(
          ordered.map((s, i) =>
            s.position === i
              ? Promise.resolve()
              : apiRequest("PATCH", `/api/sections/${s.id}`, { position: i }, authHeaders(secret)),
          ),
        ),
      "已調整區段順序",
    );
  }

  async function create() {
    if (!newTitle.trim()) return;
    await run(
      () =>
        apiRequest(
          "POST",
          "/api/sections",
          { title: newTitle, anchor: newAnchor, position: sections.length },
          authHeaders(secret),
        ),
      "已新增區段",
    );
    setNewTitle("");
    setNewAnchor("");
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur-md sm:p-8"
      data-testid="modal-section-editor"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-xl rounded-2xl border border-card-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4">
          <h2 className="font-serif text-xl font-bold text-card-foreground">管理區段 SECTIONS</h2>
          <button
            data-testid="button-close-section-editor"
            onClick={onClose}
            className="rounded-lg border border-border p-2 text-muted-foreground hover-elevate"
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-6 py-5">
          {sections.map((s, idx) => (
            <SectionRow
              key={s.id}
              section={s}
              index={idx}
              isFirst={idx === 0}
              isLast={idx === sections.length - 1}
              busy={busy}
              run={run}
              move={move}
              secret={secret}
            />
          ))}

          <div className="mt-4 space-y-2 rounded-lg border border-dashed border-border p-3">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              新增區段
            </p>
            <input
              data-testid="input-new-section-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="區段標題"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              data-testid="input-new-section-anchor"
              value={newAnchor}
              onChange={(e) => setNewAnchor(e.target.value)}
              placeholder="錨點，例如 SEC_G"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <button
              data-testid="button-add-section"
              onClick={create}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover-elevate disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> 新增區段
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionRow({
  section,
  index,
  isFirst,
  isLast,
  busy,
  run,
  move,
  secret,
}: {
  section: Section;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  run: (fn: () => Promise<any>, ok: string) => Promise<void>;
  move: (index: number, dir: -1 | 1) => Promise<void>;
  secret: string | null;
}) {
  const [title, setTitle] = useState(section.title);
  const [anchor, setAnchor] = useState(section.anchor);

  return (
    <div className="flex items-center gap-2" data-testid={`row-section-${section.id}`}>
      <div className="flex flex-col">
        <button
          data-testid={`button-move-section-up-${section.id}`}
          onClick={() => move(index, -1)}
          disabled={busy || isFirst}
          className="rounded-md border border-border p-1 text-muted-foreground hover-elevate disabled:opacity-30"
          aria-label="上移"
          title="上移"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          data-testid={`button-move-section-down-${section.id}`}
          onClick={() => move(index, 1)}
          disabled={busy || isLast}
          className="rounded-md border border-border p-1 text-muted-foreground hover-elevate disabled:opacity-30"
          aria-label="下移"
          title="下移"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        data-testid={`input-section-title-${section.id}`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
      <input
        data-testid={`input-section-anchor-${section.id}`}
        value={anchor}
        onChange={(e) => setAnchor(e.target.value)}
        className="w-28 rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs"
      />
      <button
        data-testid={`button-save-section-${section.id}`}
        onClick={() =>
          run(
            () =>
              apiRequest("PATCH", `/api/sections/${section.id}`, { title, anchor }, authHeaders(secret)),
            "已更新區段",
          )
        }
        disabled={busy}
        className="rounded-lg border border-border p-2 text-primary hover-elevate"
        aria-label="儲存區段"
      >
        <Save className="h-4 w-4" />
      </button>
      <button
        data-testid={`button-delete-section-${section.id}`}
        onClick={() => {
          if (window.confirm(`刪除「${section.title}」及其所有項目？`))
            run(
              () => apiRequest("DELETE", `/api/sections/${section.id}`, undefined, authHeaders(secret)),
              "已刪除區段",
            );
        }}
        disabled={busy}
        className="rounded-lg border border-destructive/40 p-2 text-destructive hover-elevate"
        aria-label="刪除區段"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
