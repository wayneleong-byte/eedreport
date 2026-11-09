import { useCallback, useEffect, useRef, useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useEditAuth } from "@/lib/report";
import { useToast } from "@/hooks/use-toast";
import { persistOrder, type Orderable } from "@/lib/reorder";

function markDragging(on: boolean) {
  document.documentElement.classList.toggle("eed-dragging", on);
}

function sameIds(a: Orderable[], b: Orderable[]) {
  return a.length === b.length && a.every((row, index) => row.id === b[index].id);
}

/**
 * Local order for a framer-motion Reorder list. Server rows stay the source of
 * truth except while a drag gesture or an in-flight save is holding the list.
 */
export function useSortableOrder<T extends Orderable>(
  source: T[],
  kind: "sections" | "items",
  okTitle: string,
) {
  const { secret } = useEditAuth();
  const { toast } = useToast();
  const [local, setLocal] = useState(source);
  const latest = useRef(source);
  const sourceRef = useRef(source);
  const hold = useRef(false);
  const gesture = useRef(false);
  const writing = useRef(false);
  const pending = useRef<T[] | null>(null);
  sourceRef.current = source;

  const sig = JSON.stringify(source);
  useEffect(() => {
    if (hold.current) return;
    const next = sourceRef.current;
    latest.current = next;
    setLocal(next);
  }, [sig]);

  const releaseHold = useCallback(() => {
    if (gesture.current || pending.current) return;
    hold.current = false;
    const server = sourceRef.current;
    if (sameIds(latest.current, server)) {
      latest.current = server;
      setLocal(server);
    }
  }, []);

  const commit = useCallback(
    (next: T[]) => {
      pending.current = next;
      if (writing.current) return;
      writing.current = true;
      hold.current = true;
      void (async () => {
        let changed = false;
        try {
          while (pending.current) {
            const batch = pending.current;
            pending.current = null;
            if (await persistOrder(kind, batch, secret)) changed = true;
          }
          if (changed) {
            await queryClient.invalidateQueries({ queryKey: ["/api/report"] });
            toast({ title: okTitle });
          }
        } catch (e: unknown) {
          pending.current = null;
          const message = e instanceof Error ? e.message : String(e);
          toast({ title: "操作失敗", description: message, variant: "destructive" });
          await queryClient.invalidateQueries({ queryKey: ["/api/report"] });
          const fresh = sourceRef.current;
          latest.current = fresh;
          setLocal(fresh);
        } finally {
          writing.current = false;
          releaseHold();
        }
      })();
    },
    [kind, secret, okTitle, toast, releaseHold],
  );

  const onReorder = useCallback((next: T[]) => {
    latest.current = next;
    setLocal(next);
  }, []);

  const onDragStart = useCallback(() => {
    gesture.current = true;
    hold.current = true;
    markDragging(true);
  }, []);

  const onDragEnd = useCallback((index?: number, nudge = 0) => {
    gesture.current = false;
    markDragging(false);
    let next = latest.current;
    // Framer swaps only after the pointer crosses the next row's midpoint.
    // Tall sections make that a long pull, and a slow drop can report no
    // velocity. A deliberate 56px nudge still moves one slot.
    if (nudge !== 0 && index != null && sameIds(next, sourceRef.current)) {
      const target = Math.max(0, Math.min(next.length - 1, index + nudge));
      if (target !== index) {
        const copy = next.slice();
        const [row] = copy.splice(index, 1);
        copy.splice(target, 0, row);
        next = copy;
        latest.current = next;
        setLocal(next);
      }
    }
    if (sameIds(next, sourceRef.current)) {
      releaseHold();
      return;
    }
    commit(next);
  }, [commit, releaseHold]);

  const moveBy = useCallback(
    (index: number, dir: -1 | 1) => {
      const cur = latest.current;
      const target = index + dir;
      if (target < 0 || target >= cur.length) return;
      const next = cur.slice();
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row);
      latest.current = next;
      setLocal(next);
      commit(next);
    },
    [commit],
  );

  return { local, onReorder, onDragStart, onDragEnd, moveBy };
}
