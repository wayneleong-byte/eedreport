import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ItemView } from "@shared/schema";
import {
  ReportData,
  useEditAuth,
  itemsForSection,
} from "@/lib/report";
import { ReportCard } from "@/components/ReportCard";
import { ItemModal } from "@/components/ItemModal";
import { ItemEditor } from "@/components/ItemEditor";
import { SectionEditor } from "@/components/SectionEditor";
import { EditorLogin } from "@/components/EditorLogin";
import {
  PenSquare,
  LogOut,
  Plus,
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
  const targetRef = useRef<HTMLDivElement>(null);

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

  const onLock = useCallback((el: HTMLElement) => {
    if (projectionPure) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const t = targetRef.current;
    if (!t) return;
    const r = el.getBoundingClientRect();
    t.style.left = `${r.left + r.width / 2 - 24}px`;
    t.style.top = `${r.top + r.height / 2 - 24}px`;
    t.classList.add("on");
  }, [projectionPure]);

  const onUnlock = useCallback(() => {
    targetRef.current?.classList.remove("on");
  }, []);

  return (
    <div className="eed-holodeck-bg relative min-h-screen text-foreground">
      {!projectionPure && (
        <>
          <div className="eed-holo-grid" aria-hidden />
          <div className="eed-depth-far" aria-hidden />
          <div className="eed-scanlines" aria-hidden />
          <div className="eed-vignette" aria-hidden />
        </>
      )}
      <div ref={targetRef} className="eed-target" aria-hidden />

      {/* HUD top bar */}
      <header className="eed-hud-bar eed-enter-down relative z-30">
        <div className="grid grid-cols-1 items-center gap-2 px-4 py-3.5 font-mono text-[13px] tracking-wider text-muted-foreground sm:grid-cols-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span>SYS · EED-BRIEF · ONLINE</span>
            <span className="inline-flex gap-2" aria-hidden>
              <i className="eed-hud-light l1" />
              <i className="eed-hud-light l2" />
              <i className="eed-hud-light l3" />
            </span>
          </div>
          <div className="eed-hud-title text-center text-[15px] font-medium text-primary">
            ◈ GLASS DEPTH DECK · MSC
          </div>
          <div className="flex items-center justify-end gap-2 text-right">
            <span className="hidden sm:inline">{clock}</span>
            <button
              data-testid="button-toggle-projection-pure"
              onClick={() => setProjectionPure((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1 border px-2 py-1 text-[12px] tracking-wide",
                projectionPure
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50",
              )}
              aria-pressed={projectionPure}
              title="投影純淨：關閉掃描線／光效"
            >
              <Monitor className="h-3 w-3" />
              {projectionPure ? "PURE" : "FX"}
            </button>
            <button
              data-testid="button-toggle-theme"
              onClick={toggle}
              className="border border-border p-1.5 text-muted-foreground hover:border-primary/50"
              aria-label="切換主題"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            {IS_STATIC ? (
              <span
                className="border border-border px-2 py-1 text-[12px] text-muted-foreground"
                title="GitHub Pages 靜態預覽唔支援寫入"
              >
                READ-ONLY
              </span>
            ) : !isEditor ? (
              <button
                data-testid="button-open-editor"
                onClick={() => setShowLogin(true)}
                className="inline-flex items-center gap-1 border border-primary/40 bg-primary/10 px-2 py-1 text-[12px] font-medium text-primary"
              >
                <PenSquare className="h-3 w-3" />
                EDITOR
              </button>
            ) : (
              <>
                <button
                  data-testid="button-manage-sections"
                  onClick={() => setShowSections(true)}
                  className="inline-flex items-center gap-1 border border-border px-2 py-1 text-[12px]"
                >
                  <Layers className="h-3 w-3" />
                  區段
                </button>
                <button
                  data-testid="button-exit-editor"
                  onClick={() => setSecret(null)}
                  className="inline-flex items-center gap-1 border border-border px-2 py-1 text-[12px] text-muted-foreground"
                >
                  <LogOut className="h-3 w-3" />
                  離開
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1280px] px-5 py-7">
        {/* Mission brief + KPI */}
        <section className="mb-8 grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
          <div className="eed-enter-down">
            <div className="eed-float">
              <div className="eed-glass eed-lift eed-lift-panel px-6 py-[22px]">
                <div className="eed-lock-corners" aria-hidden />
                <p className="mb-2 font-mono text-[12px] tracking-[0.28em] text-primary">MISSION BRIEF</p>
                <h1
                  data-testid="text-app-title"
                  className="text-[26px] font-semibold tracking-tight sm:text-[28px]"
                >
                  主管會 EED 報告事項
                </h1>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  展覽與教育推進 · 決策焦點：展廳更新進度、特展下一站、賽事節點。
                </p>
                <p className="mt-3 font-mono text-[13px] text-muted-foreground" data-testid="text-date">
                  MACAU SCIENCE CENTER · EED SUPERVISOR BRIEFING
                </p>
              </div>
            </div>
          </div>

          <div className="eed-enter-down" style={{ animationDelay: "0.15s" }}>
            <div className="eed-float eed-float-b">
              <div className="eed-glass eed-lift eed-lift-panel p-4">
                <div className="eed-lock-corners" aria-hidden />
                <div className="grid grid-cols-3 gap-3">
                  <div className="eed-float eed-float-kpi">
                    <div className="eed-kpi-cell eed-glass-cell p-3.5">
                      <div className="font-mono text-[12px] tracking-widest text-muted-foreground">ITEMS</div>
                      <div
                        data-testid="text-total-items"
                        className="eed-kpi-val mt-1 font-mono text-[30px] font-semibold tabular-nums text-primary"
                      >
                        {pad2(tickItems)}
                      </div>
                    </div>
                  </div>
                  <div className="eed-float eed-float-kpi">
                    <div className="eed-kpi-cell eed-glass-cell p-3.5">
                      <div className="font-mono text-[12px] tracking-widest text-muted-foreground">SECTIONS</div>
                      <div className="eed-kpi-val mt-1 font-mono text-[30px] font-semibold tabular-nums text-primary">
                        {pad2(tickSections)}
                      </div>
                    </div>
                  </div>
                  <div className="eed-float eed-float-kpi">
                    <div className="eed-kpi-cell eed-glass-cell p-3.5">
                      <div className="font-mono text-[12px] tracking-widest text-muted-foreground">LIVE</div>
                      <div className="mt-1 font-mono text-[30px] font-semibold tabular-nums text-[hsl(var(--amber))]">
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
        <main className="space-y-7">
          {isLoading && <SkeletonRows />}

          {data?.sections.map((section) => {
            const items = itemsForSection(data, section.id);
            return (
              <section
                key={section.id}
                id={section.anchor || `section-${section.id}`}
                data-testid={`section-${section.id}`}
                className="scroll-mt-24"
              >
                <div className="mb-3.5 flex items-center gap-3 font-mono text-sm">
                  {section.anchor && (
                    <span className="eed-sec-tag">
                      {section.anchor}
                    </span>
                  )}
                  <h2
                    data-testid={`text-section-title-${section.id}`}
                    className="font-sans text-xl font-semibold tracking-normal"
                  >
                    {section.title}
                  </h2>
                  <div className="eed-section-rule h-px flex-1" />
                  <span className="text-muted-foreground">{items.length} ENTRIES</span>
                  {isEditor && (
                    <button
                      data-testid={`button-add-item-${section.id}`}
                      onClick={() => setCreatingFor(section.id)}
                      className="inline-flex items-center gap-1 border border-primary/40 bg-primary/10 px-2 py-1 text-[12px] font-medium text-primary"
                    >
                      <Plus className="h-3 w-3" /> 新增
                    </button>
                  )}
                </div>

                {items.length === 0 ? (
                  <p className="border border-dashed border-primary/30 px-4 py-6 text-center text-base text-muted-foreground">
                    此區段尚無項目。
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {items.map((item, idx) => (
                      <ReportCard
                        key={item.id}
                        item={item}
                        index={idx}
                        onOpen={() => setOpenItem(item)}
                        onEdit={() => setEditItem(item)}
                        onLock={onLock}
                        onUnlock={onUnlock}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </main>

        <footer className="mt-12 border-t border-primary/20 py-6 text-center font-mono text-[12px] tracking-widest text-muted-foreground">
          澳門科學館 · EED · GLASS DEPTH DECK
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
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="eed-row-glass h-16 animate-pulse" />
      ))}
    </div>
  );
}
