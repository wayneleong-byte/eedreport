import { useEffect, useRef } from "react";
import { rememberPointerY } from "@/lib/reorder";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  radius: number;
};

const MAX_PARTICLES = 90;

/**
 * Light-dot comet that follows the pointer only while a reorder drag is active.
 * Stays off for prefers-reduced-motion and for projection PURE.
 */
export function DragComet() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let particles: Particle[] = [];
    let frame = 0;
    let running = false;
    let lastX = 0;
    let lastY = 0;
    let hasLast = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const trailEnabled = () =>
      !reduce.matches && !document.documentElement.classList.contains("projection-pure");

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const next: Particle[] = [];
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life -= 0.012;
        if (p.life <= 0) continue;
        next.push(p);
        const alpha = Math.max(p.life, 0);
        ctx.beginPath();
        ctx.fillStyle = `rgba(186, 246, 255, ${alpha * 0.85})`;
        ctx.shadowColor = "rgba(125, 246, 255, 1)";
        ctx.shadowBlur = 18;
        ctx.arc(p.x, p.y, Math.max(2.2, p.radius * (0.55 + alpha)), 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha + 0.15)})`;
        ctx.shadowBlur = 8;
        ctx.arc(p.x, p.y, Math.max(1.2, p.radius * 0.38), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      particles = next;
      const dragging = document.documentElement.classList.contains("eed-dragging");
      if (particles.length > 0 || dragging) {
        frame = window.requestAnimationFrame(draw);
      } else {
        running = false;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    const ensure = () => {
      if (running) return;
      running = true;
      frame = window.requestAnimationFrame(draw);
    };

    const onMove = (event: PointerEvent) => {
      if (!document.documentElement.classList.contains("eed-dragging") || !trailEnabled()) {
        hasLast = false;
        return;
      }
      if (!hasLast) {
        lastX = event.clientX;
        lastY = event.clientY;
        hasLast = true;
      }
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      const steps = 3;
      for (let i = 1; i <= steps; i++) {
        particles.push({
          x: lastX + (dx * i) / steps,
          y: lastY + (dy * i) / steps,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45 - 0.15,
          life: 1,
          radius: 3.2 + Math.random() * 2.6,
        });
      }
      if (particles.length > MAX_PARTICLES) {
        particles.splice(0, particles.length - MAX_PARTICLES);
      }
      lastX = event.clientX;
      lastY = event.clientY;
      ensure();
    };

    const onEnd = () => {
      hasLast = false;
    };

    let pointerDown = false;
    let dragged = false;
    let swallowClick = false;
    const onPointerDown = (event: PointerEvent) => {
      rememberPointerY(event.clientY);
      pointerDown = true;
      dragged = false;
    };
    const onPointerMoveDrag = (event: PointerEvent) => {
      rememberPointerY(event.clientY);
      if (pointerDown && document.documentElement.classList.contains("eed-dragging")) dragged = true;
      onMove(event);
    };
    const onPointerUp = (event: PointerEvent) => {
      rememberPointerY(event.clientY);
      swallowClick = dragged;
      pointerDown = false;
      dragged = false;
      onEnd();
    };
    const onClickCapture = (event: MouseEvent) => {
      if (!swallowClick) return;
      swallowClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointermove", onPointerMoveDrag);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("pointercancel", onPointerUp, true);
    window.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointermove", onPointerMoveDrag);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerUp, true);
      window.removeEventListener("click", onClickCapture, true);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={ref} className="eed-drag-comet" aria-hidden />;
}
