import { motion } from 'framer-motion';
import { ArrowRight, Lock, Map, Play, Sparkles, Target } from 'lucide-react';
import { Icon } from '../components/Icon';
import { allAchievements } from '../lib/achievements';
import { navigate } from '../lib/router';
import { currentRank, levelInfo, masteredCount, packProgress, recommendedSkill } from '../lib/progress';
import { play } from '../lib/sound';
import { useGame } from '../lib/store';
import { packs } from '../packs';
import type { Pack } from '../packs/types';

const up = (d = 0) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { delay: d, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] as const } });

export function HomeView({ pack }: { pack: Pack }) {
  const state = useGame((s) => s);
  const pp = packProgress(state, pack.id);
  const mastered = masteredCount(pack, pp);
  const next = recommendedSkill(pack, pp);
  const { rank } = currentRank(pack, pp);
  const lvl = levelInfo(state.xp);
  const achCount = Object.keys(state.achievements).length;
  const achTotal = allAchievements(packs).length;
  const fresh = mastered === 0 && Object.keys(pp.lessonsDone).length === 0;

  return (
    <div className="page">
      <section className="hero">
        <div>
          <motion.div className="eyebrow" {...up(0.05)}>
            {state.profile ? `Olá, ${state.profile.name}` : 'Aprendizagem gamificada'} · {rank.title}
          </motion.div>
          <motion.h1 {...up(0.12)}>
            Aprende.<br />Sobe de nível.<br /><span className="glow">Domina {pack.name}.</span>
          </motion.h1>
          <motion.p className="lead" {...up(0.2)}>
            Uma skill tree interativa que te leva dos fundamentos até <b>{pack.goalTitle}</b>. Cada skill tem lições práticas e um desafio final — passa-o para desbloquear o caminho seguinte.
          </motion.p>
          <motion.div className="hero-cta" {...up(0.28)}>
            {next && (
              <button
                className="btn btn-primary btn-lg"
                onMouseEnter={() => play('hover')}
                onClick={() => { play('open'); navigate('tree', next.id); }}
              >
                <Play size={20} fill="currentColor" /> {fresh ? 'Começar a jornada' : `Continuar: ${next.title}`}
              </button>
            )}
            <button className="btn btn-lg" onMouseEnter={() => play('hover')} onClick={() => { play('whoosh'); navigate('tree'); }}>
              <Map size={20} /> Explorar o roadmap
            </button>
          </motion.div>
        </div>
        <motion.div className="hero-art" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: 'easeOut' }}>
          <Orbit pack={pack} masteredIds={pp.mastered} />
        </motion.div>
      </section>

      <div className="stat-row">
        {[
          { v: lvl.level, l: 'Nível' },
          { v: state.xp.toLocaleString('pt-PT'), l: 'XP total' },
          { v: `${mastered}/${pack.skills.length}`, l: 'Skills dominadas' },
          { v: `${achCount}/${achTotal}`, l: 'Conquistas' },
        ].map((s, i) => (
          <motion.div key={s.l} className="glass stat" {...up(0.35 + i * 0.07)}>
            <div className="v">{s.v}</div>
            <div className="l">{s.l}</div>
          </motion.div>
        ))}
      </div>

      <div className="section-title">
        <div>
          <div className="eyebrow">Pacotes de aprendizagem</div>
          <h2>Escolhe o teu caminho</h2>
        </div>
      </div>
      <div className="packs">
        {packs.map((p) => {
          const ppp = packProgress(state, p.id);
          const m = masteredCount(p, ppp);
          return (
            <motion.div
              key={p.id}
              className="glass pack-card"
              whileHover={{ y: -4 }}
              onMouseEnter={() => play('hover')}
              onClick={() => { play('whoosh'); navigate('tree'); }}
              {...up(0.4)}
            >
              <div className="pack-glow" />
              <span className="chip yellow"><Sparkles size={12} /> Instalado</span>
              <h3>{p.name}</h3>
              <p className="muted" style={{ margin: '0 0 14px', maxWidth: 520 }}>{p.description}</p>
              <div className="goal"><Target size={16} /> Objetivo: {p.goalTitle}</div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="progress-track" style={{ flex: 1 }}>
                  <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${(m / p.skills.length) * 100}%` }} transition={{ duration: 1.2, delay: 0.6 }} />
                </div>
                <b style={{ fontSize: 14 }}>{Math.round((m / p.skills.length) * 100)}%</b>
              </div>
              {next && (
                <div className="next-up">
                  <div className="panel-icon" style={{ width: 48, height: 48, borderRadius: 14 }}><Icon name={next.icon} size={22} /></div>
                  <div style={{ flex: 1 }}>
                    <div className="eyebrow" style={{ fontSize: 10 }}>Próximo passo recomendado</div>
                    <div style={{ fontWeight: 800 }}>{next.title}</div>
                    <div className="muted" style={{ fontSize: 13 }}>{next.subtitle}</div>
                  </div>
                  <ArrowRight size={20} color="var(--accent)" />
                </div>
              )}
            </motion.div>
          );
        })}
        {[
          { name: 'Data & IA', goal: 'Engenheiro de Dados', icon: 'sparkles' },
          { name: 'Cibersegurança', goal: 'Especialista em Segurança', icon: 'shield' },
        ].map((p, i) => (
          <motion.div key={p.name} className="glass pack-card soon" {...up(0.48 + i * 0.06)}>
            <span className="chip"><Lock size={12} /> Em breve</span>
            <div style={{ marginTop: 18, color: 'var(--dim)' }}><Icon name={p.icon} size={36} /></div>
            <h3>{p.name}</h3>
            <div className="goal" style={{ color: 'var(--muted)' }}><Target size={16} /> {p.goal}</div>
          </motion.div>
        ))}
      </div>

      <footer className="footer">
        <b>EDA SkillQuest</b> · Progresso guardado localmente no teu browser · Construído com Claude
      </footer>
    </div>
  );
}

/** Rotating rings of skill icons orbiting the pack goal. */
function Orbit({ pack, masteredIds }: { pack: Pack; masteredIds: Record<string, number> }) {
  const skills = pack.skills.filter((s) => !s.goal);
  const goal = pack.skills.find((s) => s.goal);
  const rings = [skills.slice(0, 6), skills.slice(6, 16)];
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="core" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fff3a8" />
          <stop offset="0.5" stopColor="#ffd200" />
          <stop offset="1" stopColor="#d68b00" />
        </radialGradient>
        <radialGradient id="halo">
          <stop offset="0" stopColor="rgba(255,210,0,.35)" />
          <stop offset="1" stopColor="rgba(255,210,0,0)" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="200" fill="url(#halo)" />
      {[95, 165].map((r, i) => (
        <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="rgba(237,237,237,.09)" strokeDasharray={i ? '2 8' : '4 6'} />
      ))}
      {rings.map((ring, ri) => {
        const r = ri === 0 ? 95 : 165;
        return (
          <g key={ri} className={`orbit-ring ${ri ? 'rev' : ''}`}>
            {ring.map((s, i) => {
              const a = (i / ring.length) * Math.PI * 2;
              const x = 200 + r * Math.cos(a), y = 200 + r * Math.sin(a);
              const on = !!masteredIds[s.id];
              return (
                <g key={s.id} className="orbit-item" style={{ transformOrigin: `${x}px ${y}px` }}>
                  <circle cx={x} cy={y} r="22" fill={on ? 'url(#core)' : '#17181d'} stroke={on ? '#ffe566' : 'rgba(255,210,0,.45)'} strokeWidth="1.5" />
                  <foreignObject x={x - 11} y={y - 11} width="22" height="22" style={{ color: on ? '#141414' : '#ffd200' }}>
                    <Icon name={s.icon} size={22} strokeWidth={2} />
                  </foreignObject>
                </g>
              );
            })}
          </g>
        );
      })}
      <motion.circle cx="200" cy="200" r="52" fill="url(#core)" animate={{ r: [50, 55, 50] }} transition={{ duration: 3, repeat: Infinity }} style={{ filter: 'drop-shadow(0 0 30px rgba(255,210,0,.7))' }} />
      {goal && (
        <foreignObject x="176" y="176" width="48" height="48" style={{ color: '#141414' }}>
          <Icon name={goal.icon} size={48} strokeWidth={2} />
        </foreignObject>
      )}
    </svg>
  );
}
