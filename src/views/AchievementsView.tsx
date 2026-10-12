import { motion } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import { Icon } from '../components/Icon';
import { allAchievements, milestoneAchievements, globalAchievements, rarityLabel, type Achievement } from '../lib/achievements';
import { currentRank, packProgress, type AppState } from '../lib/progress';
import { useGame } from '../lib/store';
import { packs } from '../packs';
import type { Pack } from '../packs/types';
import { play } from '../lib/sound';

export function AchievementsView({ pack }: { pack: Pack }) {
  const state = useGame((s) => s);
  const pp = packProgress(state, pack.id);
  const { index, mastered } = currentRank(pack, pp);
  const total = allAchievements(packs).length;
  const got = Object.keys(state.achievements).length;

  return (
    <div className="page">
      <div className="eyebrow">Conquistas</div>
      <h1 style={{ fontSize: 'clamp(32px,5vw,48px)', margin: '6px 0 6px', letterSpacing: '-0.03em' }}>Sala de Troféus</h1>
      <p className="muted" style={{ marginTop: 0 }}>{got} de {total} conquistas desbloqueadas.</p>

      <motion.div className="glass milestone-track" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="eyebrow">Carreira · {pack.name}</div>
        <h2 style={{ margin: '6px 0 0', letterSpacing: '-0.02em' }}>A tua progressão de rank</h2>
        <div className="ranks">
          {pack.ranks.map((r, i) => (
            <div key={r.title} className={`rank ${i <= index ? 'on' : ''} ${i === index ? 'current' : ''}`}>
              <motion.div className="dot" initial={{ scale: 0 }} animate={{ scale: i === index ? 1.15 : 1 }} transition={{ delay: 0.2 + i * 0.1, type: 'spring' }}>
                {i <= index ? <Check size={20} strokeWidth={3} /> : i + 1}
              </motion.div>
              <div className="rt">{r.title}</div>
              <div className="rs">{r.minMastered === 0 ? 'Início' : `${r.minMastered} skills`}{i === index + 1 ? ` · faltam ${r.minMastered - mastered}` : ''}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <Group state={state} title="Marcos do roadmap" items={milestoneAchievements([pack])} />
      <Group state={state} title="Conquistas gerais" items={globalAchievements} />
    </div>
  );
}

function Group({ state, title, items }: { state: AppState; title: string; items: Achievement[] }) {
    return (
      <>
        <div className="section-title" style={{ marginTop: 34 }}><h2>{title}</h2></div>
        <div className="ach-grid">
          {items.map((a, i) => {
            const unlocked = !!state.achievements[a.id];
            const hidden = a.secret && !unlocked;
            const prog = a.progress ? a.progress(state, packs) : unlocked ? 1 : 0;
            return (
              <motion.div
                key={a.id}
                className={`ach ${a.rarity} ${unlocked ? 'unlocked' : ''}`}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -4, rotateX: 4, rotateY: -4 }}
                onMouseEnter={() => play('hover')}
                transition={{ delay: 0.03 * i, type: 'spring', stiffness: 260, damping: 22 }}
                style={{ transformPerspective: 800 }}
              >
                <div className="ach-icon">{hidden ? <Lock size={24} /> : <Icon name={a.icon} size={28} />}</div>
                <h4>{hidden ? 'Conquista secreta' : a.title}</h4>
                <p>{hidden ? 'Continua a jogar para descobrir…' : a.description}</p>
                {!unlocked && a.progress && !hidden && (
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${prog * 100}%` }} /></div>
                )}
                <div className="foot">
                  <span className="rarity">{rarityLabel[a.rarity]}</span>
                  <span className="muted">
                    {unlocked ? new Date(state.achievements[a.id]).toLocaleDateString('pt-PT') : a.xp ? `+${a.xp} XP` : ''}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </>
    );
  }
