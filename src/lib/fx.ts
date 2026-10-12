import confetti from 'canvas-confetti';

const COLORS = ['#ffd200', '#ffe566', '#f0a500', '#ededed', '#878787'];
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function burst(x = 0.5, y = 0.5, scale = 1) {
  if (reduced()) return;
  confetti({ particleCount: Math.round(90 * scale), spread: 75, startVelocity: 42, origin: { x, y }, colors: COLORS, scalar: 1.1, zIndex: 200 });
}

export function celebrate(duration = 2200) {
  if (reduced()) return;
  const end = Date.now() + duration;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors: COLORS, zIndex: 200 });
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors: COLORS, zIndex: 200 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  setTimeout(() => confetti({ particleCount: 160, spread: 120, startVelocity: 55, origin: { y: 0.45 }, colors: COLORS, shapes: ['star', 'circle'], zIndex: 200 }), 250);
}
