import { useEffect, useRef } from 'react';

/**
 * Animated "constellation" backdrop: drifting particles that link up when close
 * and react to the pointer. Throttled to the screen refresh and paused when the
 * tab is hidden; honours prefers-reduced-motion.
 */
export function Background() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, dpr = 1, raf = 0;
    const mouse = { x: -9999, y: -9999 };
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; gold: boolean };
    let ps: P[] = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(110, (w * h) / 16000));
      ps = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.4,
        a: Math.random() * Math.PI * 2,
        gold: Math.random() < 0.28,
      }));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      // subtle grid
      ctx.strokeStyle = 'rgba(237,237,237,0.025)';
      ctx.lineWidth = 1;
      const g = 64;
      ctx.beginPath();
      for (let x = 0; x < w; x += g) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
      for (let y = 0; y < h; y += g) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
      ctx.stroke();

      for (const p of ps) {
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
          p.a += 0.02;
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 14000) {
            const f = (14000 - d2) / 14000 * 0.6;
            p.x += (dx / Math.sqrt(d2 + 1)) * f;
            p.y += (dy / Math.sqrt(d2 + 1)) * f;
          }
          if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
        }
      }
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i], b = ps[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = dx * dx + dy * dy;
          if (d < 15000) {
            const o = (1 - d / 15000) * 0.16;
            ctx.strokeStyle = a.gold && b.gold ? `rgba(255,210,0,${o * 1.6})` : `rgba(237,237,237,${o})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const p of ps) {
        const tw = 0.55 + Math.sin(p.a) * 0.45;
        ctx.fillStyle = p.gold ? `rgba(255,210,0,${0.5 + tw * 0.5})` : `rgba(237,237,237,${0.25 + tw * 0.35})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (p.gold ? 1.3 : 1), 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    const onMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <>
      <canvas ref={ref} className="bg-canvas" aria-hidden />
      <div className="bg-vignette" aria-hidden />
    </>
  );
}
