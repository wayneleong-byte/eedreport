import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ItemView } from "@shared/schema";
import {
  ReportData,
  useEditAuth,
} from "@/lib/report";
import { ReportBoard } from "@/components/ReportBoard";
import { DragComet } from "@/components/DragComet";
import { ItemModal } from "@/components/ItemModal";
import { ItemEditor } from "@/components/ItemEditor";
import { SectionEditor } from "@/components/SectionEditor";
import { EditorLogin } from "@/components/EditorLogin";
import {
  PenSquare,
  LogOut,
  Layers,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useTick, pad2 } from "@/hooks/use-tick";
import { cn } from "@/lib/utils";
import { IS_STATIC } from "@/lib/queryClient";

export default function Home() {
  const { isEditor, setSecret } = useEditAuth();
  const { theme, toggle } = useTheme();
  const { data, isLoading } = useQuery<ReportData>({ queryKey: ["/api/report"] });

  const [openItem, setOpenItem] = useState<ItemView | null>(null);
  const [editItem, setEditItem] = useState<ItemView | null>(null);
  const [creatingFor, setCreatingFor] = useState<number | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSections, setShowSections] = useState(false);
  const [projectionPure, setProjectionPure] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("projection-pure", projectionPure);
    return () => document.documentElement.classList.remove("projection-pure");
  }, [projectionPure]);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setClock(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} · ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} CST+8`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const totalItems = data?.items.length ?? 0;
  const sectionCount = data?.sections.length ?? 0;
  const liveCount = useMemo(
    () => data?.items.filter((i) => /進行/.test(i.status || "")).length ?? 0,
    [data],
  );

  const tickItems = useTick(totalItems);
  const tickSections = useTick(sectionCount);
  const tickLive = useTick(liveCount);

  return (
    <div className="eed-holodeck-bg relative min-h-screen text-foreground" data-edit-mode={isEditor ? "true" : "false"}>
      {!projectionPure && (
        <>
          <div className="eed-depth-far" aria-hidden />
          <div className="eed-scanlines" aria-hidden />
          <div className="eed-vignette" aria-hidden />
        </>
      )}
      <DragComet />

      {/* HUD top bar */}
      <header className="eed-hud-bar eed-enter-down relative z-30">
        <div className="grid grid-cols-1 items-center gap-3 px-6 py-[21px] font-mono text-[20px] tracking-[0.08em] text-muted-foreground lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-x-4 lg:px-[33px]">
          <div className="flex items-center gap-3 lg:whitespace-nowrap">
            <span>SYS · EED-BRIEF · ONLINE</span>
            <span className="inline-flex gap-3" aria-hidden>
              <i className="eed-hud-light l1" />
              <i className="eed-hud-light l2" />
              <i className="eed-hud-light l3" />
            </span>
          </div>
          <div className="eed-hud-title text-center text-[23px] font-medium text-primary lg:whitespace-nowrap">
            ◈ GLASS DEPTH · BRIGHT 150 · MSC
          </div>
          <div className="flex min-w-0 flex-col items-end gap-2 text-right">
            <span className="hidden whitespace-nowrap lg:inline">{clock}</span>
            <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              data-testid="button-toggle-projection-pure"
              onClick={() => setProjectionPure((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 border px-3 py-1.5 text-[18px] tracking-wide",
                projectionPure
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50",
              )}
              aria-pressed={projectionPure}
              title="投影純淨：關閉掃描線／光效"
            >
              <Monitor className="h-[18px] w-[18px]" />
              {projectionPure ? "PURE" : "FX"}
            </button>
            <button
              data-testid="button-toggle-theme"
              onClick={toggle}
              className="border border-border p-2 text-muted-foreground hover:border-primary/50"
              aria-label="切換主題"
            >
              {theme === "dark" ? <Sun className="h-[21px] w-[21px]" /> : <Moon className="h-[21px] w-[21px]" />}
            </button>
            {IS_STATIC ? (
              <span
                className="border border-border px-3 py-1.5 text-[18px] text-muted-foreground"
                title="GitHub Pages 靜態預覽唔支援寫入"
              >
                READ-ONLY
              </span>
            ) : !isEditor ? (
              <button
                data-testid="button-open-editor"
                onClick={() => setShowLogin(true)}
                className="inline-flex items-center gap-1.5 border border-primary/40 bg-primary/10 px-3 py-1.5 text-[18px] font-medium text-primary"
              >
                <PenSquare className="h-[18px] w-[18px]" />
                EDITOR
              </button>
            ) : (
              <>
                <button
                  data-testid="button-manage-sections"
                  onClick={() => setShowSections(true)}
                  className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[18px]"
                >
                  <Layers className="h-[18px] w-[18px]" />
                  區段
                </button>
                <button
                  data-testid="button-exit-editor"
                  onClick={() => setSecret(null)}
                  className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[18px] text-muted-foreground"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  離開
                </button>
              </>
            )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-[42px] sm:px-[30px]">
        {/* Mission brief + KPI */}
        <section className="mb-12 grid items-stretch gap-[30px] md:grid-cols-[1.2fr_0.8fr]">
          <div className="eed-enter-down h-full">
            <div className="eed-float h-full">
              <div className="eed-glass eed-lift eed-lift-panel h-full px-5 py-6 sm:px-9 sm:py-[33px]">
                <div className="eed-lock-corners" aria-hidden />
                <p className="eed-kicker mb-3 font-mono text-[18px] tracking-[0.28em] text-primary">MISSION BRIEF</p>
                <h1
                  data-testid="text-app-title"
                  className="eed-display text-[39px] font-semibold tracking-tight sm:text-[42px]"
                >
                  主管會 EED 報告事項
                </h1>
                <p className="mt-3 text-[24px] leading-relaxed text-muted-foreground">
                  展覽與教育推進 · 決策焦點：展廳更新進度、特展下一站、賽事節點。
                </p>
                <p className="mt-[18px] font-mono text-[20px] text-muted-foreground" data-testid="text-date">
                  MACAU SCIENCE CENTER · EED SUPERVISOR BRIEFING
                </p>
              </div>
            </div>
          </div>

          <div className="eed-enter-down h-full" style={{ animationDelay: "0.15s" }}>
            <div className="eed-float eed-float-b h-full">
              <div className="eed-glass eed-lift eed-lift-panel flex h-full items-center px-5 py-6 sm:px-9 sm:py-[33px]">
                <div className="eed-lock-corners" aria-hidden />
                <div className="grid grid-cols-3 gap-[18px]">
                  <div className="eed-float eed-float-kpi">
                    <div className="eed-kpi-cell eed-glass-cell p-3 sm:p-[21px]">
                      <div className="font-mono text-[16px] tracking-[0.14em] text-muted-foreground sm:text-[18px]">ITEMS</div>
                      <div
                        data-testid="text-total-items"
                        className="eed-kpi-val mt-1.5 font-mono text-[34px] font-semibold tabular-nums text-primary sm:text-[45px]"
                      >
                        {pad2(tickItems)}
                      </div>
                    </div>
                  </div>
                  <div className="eed-float eed-float-kpi">
                    <div className="eed-kpi-cell eed-glass-cell p-3 sm:p-[21px]">
                      <div className="font-mono text-[16px] tracking-[0.14em] text-muted-foreground sm:text-[18px]">SECTIONS</div>
                      <div className="eed-kpi-val mt-1.5 font-mono text-[34px] font-semibold tabular-nums text-primary sm:text-[45px]">
                        {pad2(tickSections)}
                      </div>
                    </div>
                  </div>
                  <div className="eed-float eed-float-kpi">
                    <div className="eed-kpi-cell eed-glass-cell p-3 sm:p-[21px]">
                      <div className="font-mono text-[16px] tracking-[0.14em] text-muted-foreground sm:text-[18px]">LIVE</div>
                      <div className="mt-1.5 font-mono text-[34px] font-semibold tabular-nums text-[hsl(var(--amber))] sm:text-[45px]">
                        {pad2(tickLive)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sections as dense rows */}
        <main>
          {isLoading && <SkeletonRows />}
          {data && (
            <ReportBoard
              data={data}
              isEditor={isEditor}
              onOpen={setOpenItem}
              onEdit={setEditItem}
              onAdd={setCreatingFor}
            />
          )}
        </main>

        <footer className="mt-[60px] border-t border-primary/25 py-9 text-center font-mono text-[18px] tracking-[0.1em] text-muted-foreground">
          澳門科學館 · EED · GLASS DEPTH 12
        </footer>
      </div>

      {openItem && <ItemModal item={openItem} onClose={() => setOpenItem(null)} />}
      {showLogin && <EditorLogin onClose={() => setShowLogin(false)} />}
      {showSections && data && (
        <SectionEditor sections={data.sections} onClose={() => setShowSections(false)} />
      )}
      {editItem && data && (
        <ItemEditor
          item={editItem}
          sections={data.sections}
          defaultSectionId={editItem.sectionId}
          onClose={() => setEditItem(null)}
        />
      )}
      {creatingFor !== null && data && (
        <ItemEditor
          item={null}
          sections={data.sections}
          defaultSectionId={creatingFor}
          onClose={() => setCreatingFor(null)}
        />
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-[18px]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="eed-row-glass h-24 animate-pulse" />
      ))}
    </div>
  );
}
