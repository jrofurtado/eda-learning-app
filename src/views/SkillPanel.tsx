import { motion } from 'framer-motion';
import { BookOpen, Check, ChevronRight, Lock, Sparkles, Swords, X } from 'lucide-react';
import { useEffect } from 'react';
import { Icon } from '../components/Icon';
import { navigate } from '../lib/router';
import { packProgress, skillStatus } from '../lib/progress';
import { play } from '../lib/sound';
import { actions, useGame } from '../lib/store';
import type { Pack, Skill } from '../packs/types';
import { statusLabel } from './SkillTree';

export function SkillPanel({ pack, skill }: { pack: Pack; skill: Skill }) {
  const state = useGame((s) => s);
  const pp = packProgress(state, pack.id);
  const status = skillStatus(pp, skill);
  const locked = status === 'locked';
  const done = pp.lessonsDone[skill.id] ?? [];
  const best = pp.quizBest[skill.id];

  useEffect(() => {
    actions.markViewed(pack.id, skill.id);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pack.id, skill.id]);

  const close = () => {
    play('close');
    navigate('tree');
  };

  const missing = skill.deps.filter((d) => !pp.mastered[d]);
  const totalMin = skill.lessons.reduce((n, l) => n + l.minutes, 0);
  const nextLesson = skill.lessons.findIndex((l) => !done.includes(l.id));

  return (
    <>
      <motion.div className="panel-backdrop" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.aside
        className="panel glass"
        role="dialog"
        aria-label={skill.title}
        initial={{ x: 80, opacity: 0, scale: 0.98 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        exit={{ x: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      >
        <div className="panel-hero">
          <div className="pack-glow" style={{ opacity: locked ? 0.3 : 1 }} />
          <button className="icon-btn panel-close" onClick={close} aria-label="Fechar"><X size={18} /></button>
          <motion.div
            className={`panel-icon ${locked ? 'locked' : ''}`}
            initial={{ rotate: -20, scale: 0.6 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
          >
            <Icon name={skill.icon} size={36} />
          </motion.div>
          <h2>{skill.title}</h2>
          <div className="sub">{skill.subtitle}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <span className={`chip ${status === 'mastered' ? 'ok' : status === 'locked' ? '' : 'yellow'}`}>
              {status === 'mastered' ? <Check size={12} /> : status === 'locked' ? <Lock size={12} /> : <Sparkles size={12} />}
              {statusLabel[status]}
            </span>
            <span className="chip">{pack.tiers[skill.tier]?.name}</span>
            <span className="chip">{skill.lessons.length} lições · {totalMin} min</span>
            <span className="chip yellow">+{skill.xp} XP</span>
          </div>
        </div>

        <motion.div
          className="panel-body"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
        >
          <Section>
            <p style={{ margin: 0, fontSize: 16, color: '#d0d0d0' }}>{skill.summary}</p>
          </Section>

          <Section>
            <h3>O que vais aprender</h3>
            <ul className="topics">
              {skill.topics.map((t) => (
                <li key={t}><ChevronRight size={16} />{t}</li>
              ))}
            </ul>
          </Section>

          {skill.deps.length > 0 && (
            <Section>
              <h3>Requisitos</h3>
              <div className="deps">
                {skill.deps.map((d) => {
                  const ds = pack.skills.find((s) => s.id === d)!;
                  return (
                    <button key={d} className={`dep ${pp.mastered[d] ? 'ok' : ''}`} onClick={() => { play('click'); navigate('tree', d); }}>
                      <span className="di">{pp.mastered[d] ? <Check size={13} strokeWidth={3} /> : <Lock size={12} />}</span>
                      {ds.title}
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          <Section>
            <h3>Lições</h3>
            <div className="lesson-list">
              {skill.lessons.map((l, i) => {
                const isDone = done.includes(l.id);
                return (
                  <button
                    key={l.id}
                    className={`lesson-item ${isDone ? 'done' : ''}`}
                    disabled={locked}
                    onMouseEnter={() => !locked && play('hover')}
                    onClick={() => { play('click'); navigate('learn', skill.id, i); }}
                  >
                    <span className="lesson-num">{isDone ? <Check size={16} strokeWidth={3} /> : i + 1}</span>
                    <span className="t">{l.title}</span>
                    <span className="m">{l.minutes} min</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section>
            <div className="boss">
              <div className="eyebrow" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Swords size={14} /> Desafio final</div>
              <h4 style={{ marginTop: 6 }}>Prova que dominas {skill.title}</h4>
              <p>
                {skill.quiz.draw} perguntas aleatórias · precisas de {Math.round(skill.quiz.passScore * 100)}% para passar.
                {best !== undefined && <> Melhor resultado: <b>{Math.round(best * 100)}%</b>.</>}
              </p>
              {locked ? (
                <div className="muted" style={{ fontSize: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Lock size={14} /> Domina primeiro: {missing.map((d) => pack.skills.find((s) => s.id === d)?.title).join(', ')}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {status !== 'mastered' && nextLesson >= 0 && (
                    <button className="btn btn-primary" onClick={() => { play('click'); navigate('learn', skill.id, nextLesson); }}>
                      <BookOpen size={18} /> {done.length ? 'Continuar a estudar' : 'Começar a estudar'}
                    </button>
                  )}
                  <button
                    className={`btn ${status === 'mastered' || nextLesson < 0 ? 'btn-primary' : ''}`}
                    onClick={() => { play('whoosh'); navigate('quiz', skill.id); }}
                  >
                    <Swords size={18} /> {status === 'mastered' ? 'Treinar de novo' : nextLesson < 0 ? 'Iniciar desafio' : 'Já sei isto — desafio!'}
                  </button>
                </div>
              )}
            </div>
          </Section>
        </motion.div>
      </motion.aside>
    </>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <motion.section variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
      {children}
    </motion.section>
  );
}
