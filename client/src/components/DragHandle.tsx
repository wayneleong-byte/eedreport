import type { PointerEvent as ReactPointerEvent } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export function DragHandle({
  testId,
  label,
  onPointerDown,
  onMove,
  className,
}: {
  testId: string;
  label: string;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onMove: (dir: -1 | 1) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      className={cn("eed-drag-handle", className)}
      aria-label={label}
      title="拖曳排序，或按上下鍵"
      onPointerDown={(event) => {
        event.stopPropagation();
        onPointerDown(event);
      }}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          onMove(-1);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          onMove(1);
        }
      }}
    >
      <GripVertical className="h-5 w-5" aria-hidden />
    </button>
  );
}
