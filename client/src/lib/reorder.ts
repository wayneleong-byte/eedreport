import { apiRequest } from "@/lib/queryClient";
import { authHeaders } from "@/lib/report";

export type Orderable = { id: number; position: number };

let pointerY: number | null = null;

export function rememberPointerY(y: number) {
  pointerY = y;
}

export function currentPointerY() {
  return pointerY;
}

/**
 * Persist a list order the same way the section editor already does:
 * PATCH each row whose stored `position` does not match its new index.
 * Returns true when at least one request was sent.
 */
export async function persistOrder(
  kind: "sections" | "items",
  ordered: Orderable[],
  secret: string | null,
): Promise<boolean> {
  const jobs = ordered.flatMap((row, index) =>
    row.position === index
      ? []
      : [apiRequest("PATCH", `/api/${kind}/${row.id}`, { position: index }, authHeaders(secret))],
  );
  if (jobs.length === 0) return false;
  await Promise.all(jobs);
  return true;
}
