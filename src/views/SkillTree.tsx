import { AnimatePresence, motion } from 'framer-motion';
import { Check, Lock, Maximize2, Minus, Plus } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { navigate } from '../lib/router';
import { packProgress, skillCompletion, skillStatus, currentRank, masteredCount, type SkillStatus } from '../lib/progress';
import { play } from '../lib/sound';
import { useGame } from '../lib/store';
import type { Pack, Skill } from '../packs/types';
import { SkillPanel } from './SkillPanel';

/** Skills unlocked by the last quiz; the tree plays their unlock animation once. */
export const pendingUnlocks = new Set<string>();

const COL = 270; // horizontal layout: distance between tiers
const SPAN = 720; // horizontal layout: vertical extent of a tier
const PAD = 120;

interface Layout {
  pos: Record<string, { x: number; y: number }>;
  width: number;
  height: number;
  vertical: boolean;
}

function computeLayout(pack: Pack, vertical: boolean): Layout {
  const tiers = pack.tiers.length;
  const pos: Layout['pos'] = {};
  for (const s of pack.skills) {
    pos[s.id] = vertical
      ? { x: PAD * 0.6 + s.x * 560, y: PAD + s.tier * 210 }
      : { x: PAD + s.tier * COL, y: PAD + s.x * SPAN };
  }
  return vertical
    ? { pos, width: 560 + PAD * 1.2, height: PAD * 2 + (tiers - 1) * 210, vertical }
    : { pos, width: PAD * 2 + (tiers - 1) * COL, height: SPAN + PAD * 2, vertical };
}

function edgePath(a: { x: number; y: number }, b: { x: number; y: number }, vertical: boolean) {
  if (vertical) {
    const my = (a.y + b.y) / 2;
    return `M ${a.x} ${a.y} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
  }
  const mx = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
}

const HEX = (r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(' ');

export function SkillTreeView({ pack, openSkill }: { pack: Pack; openSkill?: string }) {
  const state = useGame((s) => s);
  const pp = packProgress(state, pack.id);
  const [vertical, setVertical] = useState(() => window.innerWidth < window.innerHeight * 0.9);
  const layout = useMemo(() => computeLayout(pack, vertical), [pack, vertical]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [animating, setAnimating] = useState(false);
  const [hover, setHover] = useState<{ skill: Skill; x: number; y: number } | null>(null);
  const [celebrate, setCelebrate] = useState<string[]>([]);
  const drag = useRef<{ id: number; sx: number; sy: number; vx: number; vy: number; moved: boolean } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; k: number } | null>(null);
  const suppressClick = useRef(false);

  const fit = useCallback(
    (smooth = true) => {
      const el = wrapRef.current;
      if (!el) return;
      const { clientWidth: w, clientHeight: h } = el;
      const top = layout.vertical ? 0 : 110; // keep clear of the title card
      const k = Math.max(0.42, Math.min(1.05, Math.min(w / layout.width, (h - top) / layout.height)));
      setAnimating(smooth);
      setView({ k, x: (w - layout.width * k) / 2, y: top + Math.max(0, (h - top - layout.height * k) / 2) });
    },
    [layout],
  );

  useLayoutEffect(() => fit(false), [fit]);

  useEffect(() => {
    const onResize = () => setVertical(window.innerWidth < window.innerHeight * 0.9);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Celebrate skills unlocked by the previous quiz.
  useEffect(() => {
    if (!pendingUnlocks.size) return;
    const ids = [...pendingUnlocks];
    pendingUnlocks.clear();
    const t = setTimeout(() => {
      setCelebrate(ids);
      play('unlock');
    }, 700);
    const t2 = setTimeout(() => setCelebrate([]), 3500);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  const zoomAt = (factor: number, cx: number, cy: number, smooth = false) => {
    setAnimating(smooth);
    setView((v) => {
      const k = Math.max(0.35, Math.min(1.8, v.k * factor));
      const f = k / v.k;
      return { k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f };
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > Math.abs(e.deltaX) * 2) {
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    } else {
      setAnimating(false);
      setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), k: view.k };
      return;
    }
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
    suppressClick.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = wrapRef.current!.getBoundingClientRect();
      const target = Math.max(0.35, Math.min(1.8, pinch.current.k * (d / pinch.current.d)));
      zoomAt(target / view.k, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
      suppressClick.current = true;
      return;
    }
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 6) {
      d.moved = true;
      suppressClick.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setHover(null);
    }
    if (d.moved) {
      setAnimating(false);
      setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  const open = (s: Skill) => {
    if (suppressClick.current) return;
    play('open');
    navigate('tree', s.id);
  };

  const statuses = useMemo(() => {
    const m: Record<string, SkillStatus> = {};
    pack.skills.forEach((s) => (m[s.id] = skillStatus(pp, s)));
    return m;
  }, [pack, pp]);

  const { rank } = currentRank(pack, pp);
  const mastered = masteredCount(pack, pp);
  const opened = openSkill ? pack.skills.find((s) => s.id === openSkill) : undefined;

  return (
    <>
      <div
        ref={wrapRef}
        className={`tree-wrap ${drag.current?.moved ? 'dragging' : ''}`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="tree-world"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
            transition: animating ? 'transform .6s cubic-bezier(.2,.8,.2,1)' : 'none',
          }}
        >
          <svg className="tree-edges" width={layout.width} height={layout.height}>
            <defs>
              <linearGradient id="edgeGrad" x1="0" y1="0" x2={vertical ? 0 : 1} y2={vertical ? 1 : 0}>
                <stop offset="0" stopColor="#f0a500" />
                <stop offset="0.5" stopColor="#ffd200" />
                <stop offset="1" stopColor="#ffe566" />
              </linearGradient>
            </defs>
            {pack.tiers.map((t, i) => {
              const band = vertical
                ? { x: 0, y: PAD + i * 210 - 105, w: layout.width, h: 210 }
                : { x: PAD + i * COL - COL / 2, y: 0, w: COL, h: layout.height };
              return (
                <g key={t.name}>
                  {i % 2 === 0 && <rect {...{ x: band.x, y: band.y, width: band.w, height: band.h }} fill="rgba(255,255,255,0.012)" />}
                  <text
                    x={vertical ? 14 : band.x + band.w / 2}
                    y={vertical ? band.y + 22 : layout.height - 46}
                    textAnchor={vertical ? 'start' : 'middle'}
                    fill={i === pack.tiers.length - 1 ? '#ffd200' : '#5b5c63'}
                    fontSize="12"
                    fontWeight="800"
                    letterSpacing="3"
                  >
                    {`${String(i + 1).padStart(2, '0')} · ${t.name.toUpperCase()}`}
                  </text>
                </g>
              );
            })}
            {pack.skills.flatMap((s) =>
              s.deps.map((d, i) => {
                const a = layout.pos[d], b = layout.pos[s.id];
                const path = edgePath(a, b, vertical);
                const cls =
                  statuses[d] === 'mastered' && statuses[s.id] === 'mastered'
                    ? 'edge-mastered'
                    : statuses[d] === 'mastered'
                      ? 'edge-available'
                      : '';
                return (
                  <g key={`${d}-${s.id}`}>
                    <motion.path
                      className="edge edge-base"
                      d={path}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.9, delay: 0.2 + s.tier * 0.12 + i * 0.05, ease: 'easeOut' }}
                    />
                    {cls && <path className={`edge ${cls}`} d={path} />}
                    {cls === 'edge-mastered' && (
                      <circle r="3.5" fill="#fff" opacity="0.9">
                        <animateMotion dur={`${2.4 + (i % 3) * 0.4}s`} repeatCount="indefinite" path={path} />
                      </circle>
                    )}
                  </g>
                );
              }),
            )}
          </svg>
          {pack.skills.map((s) => (
            <SkillNode
              key={s.id}
              skill={s}
              status={statuses[s.id]}
              completion={skillCompletion(pp, s)}
              pos={layout.pos[s.id]}
              celebrate={celebrate.includes(s.id)}
              onOpen={() => open(s)}
              onHover={(on, el) => {
                if (on && el && !drag.current?.moved) {
                  const r = el.getBoundingClientRect();
                  setHover({ skill: s, x: r.left + r.width / 2, y: r.top });
                  play('hover');
                } else setHover(null);
              }}
            />
          ))}
        </div>
      </div>

      <motion.div className="tree-title glass" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
        <div className="eyebrow">Pacote {pack.name}</div>
        <h2>Rumo a {pack.goalTitle}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
          <span className="chip yellow">{rank.title}</span>
          <span className="chip">{mastered} / {pack.skills.length} skills</span>
        </div>
        <div className="progress-track">
          <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${(mastered / pack.skills.length) * 100}%` }} transition={{ delay: 0.5, duration: 1.2 }} />
        </div>
      </motion.div>

      <div className="tree-hud">
        <div className="glass">
          <button className="icon-btn" title="Aproximar" onClick={() => { play('tick'); const el = wrapRef.current!; zoomAt(1.25, el.clientWidth / 2, el.clientHeight / 2, true); }}><Plus size={18} /></button>
          <button className="icon-btn" title="Afastar" onClick={() => { play('tick'); const el = wrapRef.current!; zoomAt(0.8, el.clientWidth / 2, el.clientHeight / 2, true); }}><Minus size={18} /></button>
          <button className="icon-btn" title="Ver tudo" onClick={() => { play('tick'); fit(); }}><Maximize2 size={16} /></button>
        </div>
      </div>

      <div className="legend glass">
        <span><i style={{ background: '#3a3b42' }} /> Bloqueada</span>
        <span><i style={{ background: 'transparent', border: '2px solid #ffd200' }} /> Disponível</span>
        <span><i style={{ background: '#ffd200', boxShadow: '0 0 8px #ffd200' }} /> Dominada</span>
      </div>

      <AnimatePresence>
        {hover && !opened && (
          <motion.div
            className="tooltip glass"
            style={{ left: Math.min(window.innerWidth - 296, Math.max(16, hover.x - 140)), top: Math.max(80, hover.y - 140) }}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            <div className="eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>{statusLabel[statuses[hover.skill.id]]}</div>
            <h4>{hover.skill.title}</h4>
            <p>{hover.skill.summary}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{opened && <SkillPanel key={opened.id} pack={pack} skill={opened} />}</AnimatePresence>
    </>
  );
}

export const statusLabel: Record<SkillStatus, string> = {
  locked: 'Bloqueada',
  available: 'Disponível',
  progress: 'Em progresso',
  mastered: 'Dominada',
};

function SkillNode({
  skill, status, completion, pos, celebrate, onOpen, onHover,
}: {
  skill: Skill;
  status: SkillStatus;
  completion: number;
  pos: { x: number; y: number };
  celebrate: boolean;
  onOpen: () => void;
  onHover: (on: boolean, el?: HTMLElement) => void;
}) {
  const goal = !!skill.goal;
  const size = goal ? 132 : 96;
  const locked = status === 'locked';
  const mastered = status === 'mastered';
  const fill = mastered ? 'url(#nodeGold)' : locked ? '#1c1d22' : '#17181d';
  const stroke = mastered ? '#ffe566' : locked ? '#3a3b44' : '#ffd200';
  const iconColor = mastered ? '#141414' : locked ? '#6e6f77' : '#ffd200';
  const ringR = 47;
  const ringC = 2 * Math.PI * ringR;

  return (
    <div className={`node ${status} ${goal ? 'node-goal' : ''}`} style={{ left: pos.x, top: pos.y }}>
      <motion.button
        className={`node-btn ${goal ? 'goal' : ''}`}
        onClick={onOpen}
        onMouseEnter={(e) => onHover(true, e.currentTarget)}
        onMouseLeave={() => onHover(false)}
        onFocus={(e) => onHover(true, e.currentTarget)}
        onBlur={() => onHover(false)}
        aria-label={`${skill.title} — ${statusLabel[status]}`}
        style={{ x: '-50%', y: '-50%' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={celebrate ? { scale: [1, 1.35, 0.95, 1.08, 1], opacity: 1, rotate: [0, -6, 6, 0] } : { scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.94 }}
        transition={celebrate ? { duration: 1.1 } : { type: 'spring', stiffness: 260, damping: 18, delay: 0.15 + skill.tier * 0.1 + skill.x * 0.1 }}
      >
        {(status === 'available' || celebrate) && (
          <motion.span
            className="node-pulse"
            style={{ borderRadius: '50%' }}
            animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <svg className="node-hex" viewBox="0 0 100 100" width={size} height={size} style={{ overflow: 'visible' }}>
          <defs>
            <radialGradient id="nodeGold" cx="35%" cy="25%" r="85%">
              <stop offset="0" stopColor="#fff3a8" />
              <stop offset="0.45" stopColor="#ffd200" />
              <stop offset="1" stopColor="#e09400" />
            </radialGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {!locked && (
            <circle cx="50" cy="50" r={ringR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          )}
          {!locked && completion > 0 && (
            <circle
              cx="50" cy="50" r={ringR} fill="none" stroke="#ffd200" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={ringC} strokeDashoffset={ringC * (1 - completion)} transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          )}
          <polygon
            points={HEX(38)}
            fill={fill}
            stroke={stroke}
            strokeWidth={goal ? 3 : 2.5}
            strokeLinejoin="round"
            filter={mastered || goal ? 'url(#glow)' : undefined}
          />
          {goal && <polygon points={HEX(30)} fill="none" stroke={mastered ? '#141414' : 'rgba(255,210,0,.35)'} strokeWidth="1.2" />}
        </svg>
        <span className="node-icon" style={{ color: iconColor }}>
          <Icon name={skill.icon} size={goal ? 42 : 30} strokeWidth={2.2} />
        </span>
        {locked && <span className="node-lock"><Lock size={13} /></span>}
        {mastered && !goal && <span className="node-check"><Check size={16} strokeWidth={3.5} /></span>}
      </motion.button>
      <div className="node-label">
        {skill.title}
        <small>{goal ? 'OBJETIVO FINAL' : `${skill.xp} XP`}</small>
      </div>
    </div>
  );
}
