import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { authHeaders, useEditAuth } from "@/lib/report";
import { useToast } from "@/hooks/use-toast";
import { X, KeyRound, ShieldCheck } from "lucide-react";

export function EditorLogin({ onClose }: { onClose: () => void }) {
  const { setSecret } = useEditAuth();
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);

  async function submit() {
    if (!value.trim()) return;
    setChecking(true);
    try {
      // Verify against the server before holding the secret in memory.
      await apiRequest("POST", "/api/auth/check", {}, authHeaders(value.trim()));
      setSecret(value.trim()); // held only in React memory
      toast({ title: "已進入編輯模式" });
      onClose();
    } catch {
      toast({ title: "密鑰不正確", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/85 p-4 backdrop-blur-md"
      data-testid="modal-editor-login"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-card-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="font-serif text-xl font-bold text-card-foreground">編輯模式授權</h2>
          </div>
          <button
            data-testid="button-close-login"
            onClick={onClose}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover-elevate"
            aria-label="關閉"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-base leading-relaxed text-muted-foreground">
          輸入編輯密鑰以解鎖內容編輯。密鑰只會暫存於頁面記憶體，不會寫入瀏覽器儲存。
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <input
            data-testid="input-edit-secret"
            type="password"
            value={value}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="EDIT SECRET"
            className="w-full bg-transparent py-2.5 text-base outline-none"
          />
        </div>
        <button
          data-testid="button-submit-secret"
          onClick={submit}
          disabled={checking}
          className="mt-4 w-full rounded-lg bg-primary py-2.5 text-base font-semibold text-primary-foreground hover-elevate disabled:opacity-50"
        >
          {checking ? "驗證中…" : "進入編輯模式"}
        </button>
      </div>
    </div>
  );
}
