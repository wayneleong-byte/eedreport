import { useEffect, useState } from "react";

/** Count-up tick for HUD KPIs. Respects prefers-reduced-motion. */
export function useTick(target: number, durationMs = 1100, delayMs = 400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || document.documentElement.classList.contains("projection-pure")) {
      setValue(target);
      return;
    }
    setValue(0);
    let raf = 0;
    const t0 = performance.now() + delayMs;
    const step = (t: number) => {
      if (t < t0) {
        raf = requestAnimationFrame(step);
        return;
      }
      const p = Math.min(1, (t - t0) / durationMs);
      const e = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, delayMs]);

  return value;
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}
