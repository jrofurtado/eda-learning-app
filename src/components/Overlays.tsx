import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { rarityLabel, type Achievement } from '../lib/achievements';
import { celebrate } from '../lib/fx';
import { play } from '../lib/sound';
import { onGameEvent } from '../lib/store';
import { Icon } from './Icon';

interface Toast { id: number; a: Achievement }
interface Float { id: number; amount: number; x: number; y: number }

let seq = 0;
let queued = 0;
let lastPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
window.addEventListener('pointerdown', (e) => (lastPointer = { x: e.clientX, y: e.clientY }), true);

/** Global celebration layer: achievement toasts, floating XP and the level-up modal. */
export function Overlays() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [floats, setFloats] = useState<Float[]>([]);
  const [level, setLevel] = useState<number | null>(null);

  useEffect(
    () =>
      onGameEvent((e) => {
        if (e.type === 'achievement') {
          const id = ++seq;
          // stagger multiple unlocks so each gets its moment
          const delay = 400 + queued++ * 700;
          setTimeout(() => {
            queued--;
            setToasts((t) => [...t, { id, a: e.achievement }]);
            play('achievement');
          }, delay);
          setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), delay + 5200);
        } else if (e.type === 'xp') {
          const id = ++seq;
          setFloats((f) => [...f, { id, amount: e.amount, ...lastPointer }]);
          setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1400);
        } else if (e.type === 'levelup') {
          setTimeout(() => {
            setLevel(e.level);
            play('levelup');
            celebrate(1800);
          }, 900);
        }
      }),
    [],
  );

  return (
    <>
      <div className="toasts" aria-live="polite">
        <AnimatePresence>
          {toasts.map(({ id, a }) => (
            <motion.div
              key={id}
              layout
              className={`toast ${a.rarity}`}
              initial={{ opacity: 0, x: 120, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 120, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              onClick={() => setToasts((t) => t.filter((x) => x.id !== id))}
            >
              <motion.div className="shine" initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.2, delay: 0.3 }} />
              <motion.div className="ti" initial={{ rotate: -30, scale: 0.4 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: 0.15 }}>
                <Icon name={a.icon} size={26} />
              </motion.div>
              <div>
                <div className="tt">Conquista · {rarityLabel[a.rarity]}</div>
                <div className="tn">{a.title}</div>
                <div className="td">{a.description}{a.xp ? ` · +${a.xp} XP` : ''}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {floats.map((f) => (
          <motion.div
            key={f.id}
            className="float-xp"
            style={{ left: f.x - 30, top: f.y - 20 }}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -90, scale: 1.1 }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
          >
            +{f.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {level !== null && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLevel(null)}>
            <motion.div
              className="glass modal"
              initial={{ scale: 0.6, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div className="rays" animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} />
              <div className="eyebrow" style={{ position: 'relative' }}>Subiste de nível</div>
              <motion.div className="levelup-num" initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 160, damping: 12 }} style={{ position: 'relative' }}>
                {level}
              </motion.div>
              <h1 style={{ position: 'relative' }}>Nível {level}!</h1>
              <p className="muted" style={{ position: 'relative' }}>Cada nível é prova do teu esforço. Continua a subir.</p>
              <button className="btn btn-primary btn-lg" style={{ position: 'relative', marginTop: 10 }} onClick={() => { play('click'); setLevel(null); }} autoFocus>
                Continuar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
