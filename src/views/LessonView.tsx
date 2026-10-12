import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Clock, Map, Swords } from 'lucide-react';
import { useEffect } from 'react';
import { Blocks } from '../components/Blocks';
import { Icon } from '../components/Icon';
import { navigate } from '../lib/router';
import { packProgress, skillStatus } from '../lib/progress';
import { play } from '../lib/sound';
import { actions, useGame } from '../lib/store';
import type { Pack, Skill } from '../packs/types';

export function LessonView({ pack, skill, index }: { pack: Pack; skill: Skill; index: number }) {
  const state = useGame((s) => s);
  const pp = packProgress(state, pack.id);
  const lesson = skill.lessons[index];
  const done = pp.lessonsDone[skill.id] ?? [];
  const locked = skillStatus(pp, skill) === 'locked';

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [skill.id, index]);

  if (!lesson || locked) {
    return (
      <div className="page" style={{ textAlign: 'center' }}>
        <h2>Esta lição ainda não está disponível.</h2>
        <button className="btn" onClick={() => navigate('tree', skill.id)}><Map size={18} /> Voltar ao mapa</button>
      </div>
    );
  }

  const isLast = index === skill.lessons.length - 1;
  const finish = () => {
    actions.completeLesson(pack.id, skill.id, lesson.id);
    play('xp');
    if (isLast) navigate('tree', skill.id);
    else navigate('learn', skill.id, index + 1);
  };

  return (
    <div className="page lesson-page">
      <div className="lesson-head">
        <button className="icon-btn" title="Voltar à skill" onClick={() => { play('close'); navigate('tree', skill.id); }}>
          <ArrowLeft size={18} />
        </button>
        <div className="lesson-steps" aria-label={`Lição ${index + 1} de ${skill.lessons.length}`}>
          {skill.lessons.map((l, i) => (
            <i key={l.id} className={done.includes(l.id) || i === index ? 'on' : ''} />
          ))}
        </div>
        <span className="chip"><Icon name={skill.icon} size={14} /> {skill.title}</span>
      </div>

      <motion.div key={lesson.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="eyebrow">Lição {index + 1} de {skill.lessons.length}</div>
        <h1 className="lesson-title">{lesson.title}</h1>
        <div className="lesson-meta">
          <span className="chip"><Clock size={12} /> {lesson.minutes} min</span>
          {done.includes(lesson.id) ? (
            <span className="chip ok"><Check size={12} /> Concluída</span>
          ) : (
            <span className="chip yellow">+20 XP ao concluir</span>
          )}
        </div>

        <Blocks
          blocks={lesson.blocks}
          quickcheckKey={(i) => `${skill.id}/${lesson.id}/${i}`}
          onQuickcheck={(key, ok) => actions.answerQuickcheck(pack.id, key, ok)}
        />

        <div className="lesson-nav">
          <button
            className="btn"
            disabled={index === 0}
            onClick={() => { play('click'); navigate('learn', skill.id, index - 1); }}
          >
            <ArrowLeft size={18} /> Anterior
          </button>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {isLast && (
              <button className="btn" onClick={() => { actions.completeLesson(pack.id, skill.id, lesson.id); play('whoosh'); navigate('quiz', skill.id); }}>
                <Swords size={18} /> Ir ao desafio
              </button>
            )}
            <button className="btn btn-primary" onClick={finish}>
              {isLast ? <>Concluir lição <Check size={18} /></> : <>Concluir e continuar <ArrowRight size={18} /></>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
