import { AnimatePresence, motion, animate } from 'framer-motion';
import {
  ArrowDown, ArrowRight, ArrowUp, CheckCircle2, Flame, GripVertical, Map, RotateCcw, Sparkles, Swords, Timer, Trophy, XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { highlight } from '../components/Blocks';
import { celebrate, burst } from '../lib/fx';
import { Markup } from '../lib/markup';
import { navigate } from '../lib/router';
import { normalizeAnswer, packProgress, shuffle, skillStatus } from '../lib/progress';
import { play } from '../lib/sound';
import { actions, useGame } from '../lib/store';
import type { Pack, Question, Skill } from '../packs/types';
import { pendingUnlocks } from './SkillTree';

/** A question prepared for one attempt: options shuffled, with a map back to the original indexes. */
interface Prepared {
  q: Question;
  order: number[]; // displayed position -> original index (single/multi) or item index (order)
}

function prepare(skill: Skill): Prepared[] {
  return shuffle(skill.quiz.questions)
    .slice(0, skill.quiz.draw)
    .map((q) => {
      if (q.kind === 'single' || q.kind === 'multi') return { q, order: shuffle(q.options.map((_, i) => i)) };
      if (q.kind === 'order') {
        let o = shuffle(q.items.map((_, i) => i));
        // never start already solved
        for (let g = 0; g < 5 && o.every((v, i) => v === i); g++) o = shuffle(o);
        return { q, order: o };
      }
      return { q, order: [] };
    });
}

type Result = ReturnType<typeof actions.finishQuiz>;

export function QuizView({ pack, skill }: { pack: Pack; skill: Skill }) {
  const state = useGame((s) => s);
  const pp = packProgress(state, pack.id);
  const locked = skillStatus(pp, skill) === 'locked';
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [attempt, setAttempt] = useState(0);
  const questions = useMemo(() => prepare(skill), [skill, attempt]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [combo, setCombo] = useState(0);
  const [start, setStart] = useState(0);
  const [result, setResult] = useState<(Result & { score: number; seconds: number }) | null>(null);

  if (locked) {
    return (
      <div className="page quiz-page" style={{ textAlign: 'center' }}>
        <h2>Este desafio ainda está bloqueado.</h2>
        <button className="btn" onClick={() => navigate('tree', skill.id)}><Map size={18} /> Voltar ao mapa</button>
      </div>
    );
  }

  const begin = () => {
    play('whoosh');
    setAttempt((a) => a + 1);
    setIdx(0);
    setAnswers([]);
    setCombo(0);
    setStart(Date.now());
    setResult(null);
    setPhase('play');
  };

  const onAnswered = (ok: boolean) => {
    actions.answerQuestion(ok);
    setAnswers((a) => [...a, ok]);
    setCombo((c) => (ok ? c + 1 : 0));
  };

  const next = () => {
    if (idx + 1 < questions.length) {
      play('click');
      setIdx(idx + 1);
      return;
    }
    const correct = answers.filter(Boolean).length;
    const score = correct / questions.length;
    const seconds = Math.round((Date.now() - start) / 1000);
    const r = actions.finishQuiz(pack.id, skill, score, seconds);
    r.unlocked.forEach((s) => pendingUnlocks.add(s.id));
    setResult({ ...r, score, seconds });
    setPhase('done');
    if (r.passed) {
      play(r.firstMastery ? 'mastered' : 'achievement');
      celebrate(r.firstMastery ? 2600 : 1200);
    } else play('fail');
  };

  return (
    <div className="page quiz-page">
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div key="intro" className="glass quiz-intro" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
            <motion.div className="boss-emblem" animate={{ rotate: [0, -4, 4, 0], y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Icon name={skill.icon} size={52} />
            </motion.div>
            <div className="eyebrow" style={{ marginTop: 22 }}><Swords size={13} style={{ verticalAlign: -2 }} /> Desafio final</div>
            <h1>{skill.title}</h1>
            <p className="muted" style={{ maxWidth: 520, margin: '0 auto' }}>
              Responde a perguntas aleatórias sobre tudo o que aprendeste. Acertos seguidos aumentam o teu combo. Passa e a skill fica dominada — desbloqueando o caminho seguinte.
            </p>
            <div className="quiz-rules">
              <div><b>{skill.quiz.draw}</b><span>perguntas aleatórias</span></div>
              <div><b>{Math.round(skill.quiz.passScore * 100)}%</b><span>para passar</span></div>
              <div><b>+{skill.xp}</b><span>XP · +50% se perfeito</span></div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => { play('close'); navigate('tree', skill.id); }}>Voltar</button>
              <button className="btn btn-primary btn-lg" onClick={begin} autoFocus><Swords size={20} /> Começar</button>
            </div>
          </motion.div>
        )}

        {phase === 'play' && (
          <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="quiz-top">
              <button className="icon-btn" title="Desistir" onClick={() => { play('close'); setPhase('intro'); }}><XCircle size={18} /></button>
              <div className="progress-track">
                <motion.div className="progress-fill" animate={{ width: `${((idx + (answers.length > idx ? 1 : 0)) / questions.length) * 100}%` }} />
              </div>
              <Clock start={start} />
              <motion.div className={`combo ${combo >= 3 ? 'hot' : ''}`} key={combo} initial={{ scale: 1.5 }} animate={{ scale: 1 }}>
                <Flame size={18} fill={combo >= 3 ? 'currentColor' : 'none'} /> x{combo}
              </motion.div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${attempt}-${idx}`}
                initial={{ opacity: 0, x: 60, rotateY: -8 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, x: -60, rotateY: 8 }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              >
                <QuestionCard
                  p={questions[idx]}
                  n={idx + 1}
                  total={questions.length}
                  answered={answers.length > idx}
                  onAnswer={onAnswered}
                  onNext={next}
                  last={idx + 1 === questions.length}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 'done' && result && (
          <Results key="done" pack={pack} skill={skill} result={result} answers={answers} questions={questions} onRetry={begin} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Clock({ start }: { start: number }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.floor((Date.now() - start) / 1000);
  return (
    <span className="chip" style={{ fontVariantNumeric: 'tabular-nums' }}>
      <Timer size={12} /> {Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}
    </span>
  );
}

const kindHint: Record<Question['kind'], string> = {
  single: 'Escolhe uma opção.',
  multi: 'Seleciona todas as opções corretas.',
  order: 'Arrasta (ou usa as setas) para ordenar.',
  input: 'Escreve a resposta.',
};

function QuestionCard({ p, n, total, answered, onAnswer, onNext, last }: {
  p: Prepared; n: number; total: number; answered: boolean; last: boolean;
  onAnswer: (ok: boolean) => void; onNext: () => void;
}) {
  const { q } = p;
  const [sel, setSel] = useState<number[]>([]);
  const [order, setOrder] = useState<number[]>(p.order);
  const [text, setText] = useState('');
  const [ok, setOk] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (q.kind === 'input') inputRef.current?.focus();
  }, [q]);

  const canSubmit =
    !answered && (q.kind === 'order' || (q.kind === 'input' ? text.trim().length > 0 : sel.length > 0));

  const submit = () => {
    if (!canSubmit) return;
    let correct = false;
    if (q.kind === 'single') correct = sel[0] === q.answer;
    else if (q.kind === 'multi') correct = sel.length === q.answers.length && q.answers.every((a) => sel.includes(a));
    else if (q.kind === 'order') correct = order.every((v, i) => v === i);
    else correct = q.accept.some((a) => normalizeAnswer(a) === normalizeAnswer(text));
    setOk(correct);
    play(correct ? 'correct' : 'wrong');
    if (correct) burst(0.5, 0.6, 0.35);
    onAnswer(correct);
  };

  // keyboard: 1-9 to pick, Enter to submit / continue
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.key !== 'Enter') return;
      if (e.key === 'Enter') {
        e.preventDefault();
        if (answered) onNext();
        else submit();
        return;
      }
      const d = Number(e.key);
      if (!answered && d >= 1 && (q.kind === 'single' || q.kind === 'multi') && d <= p.order.length) toggle(p.order[d - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const toggle = (orig: number) => {
    if (answered) return;
    play('select');
    if (q.kind === 'single') setSel([orig]);
    else setSel((s) => (s.includes(orig) ? s.filter((x) => x !== orig) : [...s, orig]));
  };

  const move = (from: number, to: number) => {
    if (answered || to < 0 || to >= order.length) return;
    play('tick');
    setOrder((o) => {
      const a = o.slice();
      const [it] = a.splice(from, 1);
      a.splice(to, 0, it);
      return a;
    });
  };

  return (
    <div className="glass qcard">
      <div className="qn">Pergunta {n} / {total}</div>
      <h2><Markup text={q.prompt} /></h2>
      <div className="qkind">{kindHint[q.kind]}</div>
      {'code' in q && q.code && (
        <div className="code-block" style={{ marginBottom: 18 }}>
          <pre><code>{highlight(q.code)}</code></pre>
        </div>
      )}

      {(q.kind === 'single' || q.kind === 'multi') && (
        <div className="options">
          {p.order.map((orig, i) => {
            const isRight = q.kind === 'single' ? orig === q.answer : q.answers.includes(orig);
            const picked = sel.includes(orig);
            const cls = answered ? (isRight ? 'correct' : picked ? 'wrong' : '') : picked ? 'selected' : '';
            return (
              <motion.button
                key={orig}
                className={`option ${cls}`}
                disabled={answered}
                onClick={() => toggle(orig)}
                onMouseEnter={() => !answered && play('hover')}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={answered && picked && !isRight ? { opacity: 1, y: 0, x: [0, -8, 8, -5, 5, 0] } : { opacity: 1, y: 0 }}
                transition={{ delay: answered ? 0 : 0.05 * i }}
              >
                <span className="key">{q.kind === 'multi' ? (picked ? '✓' : i + 1) : String.fromCharCode(65 + i)}</span>
                <span className="grow"><Markup text={q.options[orig]} /></span>
                {answered && isRight && <CheckCircle2 size={20} color="var(--ok)" />}
                {answered && picked && !isRight && <XCircle size={20} color="var(--bad)" />}
              </motion.button>
            );
          })}
        </div>
      )}

      {q.kind === 'order' && (
        <OrderList items={q.items} order={order} answered={answered} move={move} setOrder={setOrder} />
      )}

      {q.kind === 'input' && (
        <>
          <div className={`cmd-input ${answered ? (ok ? 'correct' : 'wrong') : ''}`}>
            <span>$</span>
            <input
              ref={inputRef}
              value={text}
              disabled={answered}
              placeholder={q.placeholder ?? 'escreve aqui…'}
              onChange={(e) => {
                setText(e.target.value);
                play('tick');
              }}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
            />
          </div>
          {answered && !ok && (
            <div className="muted" style={{ marginTop: 10, fontSize: 14 }}>
              Resposta esperada: <code className="inline-code">{q.accept[0]}</code>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {answered && ok !== null && (
          <motion.div className={`explain ${ok ? 'ok' : 'bad'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {ok ? <CheckCircle2 className="ei" size={22} /> : <XCircle className="ei" size={22} />}
            <div>
              <b>{ok ? pick(['Excelente!', 'Na mouche!', 'Isso mesmo!', 'Perfeito!']) : 'Não foi desta.'}</b>
              <Markup text={q.explanation} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="quiz-actions">
        {!answered ? (
          <button className="btn btn-primary" disabled={!canSubmit} onClick={submit}>Verificar</button>
        ) : (
          <motion.button className="btn btn-primary" onClick={onNext} initial={{ scale: 0.9 }} animate={{ scale: 1 }} autoFocus>
            {last ? <>Ver resultado <Trophy size={18} /></> : <>Seguinte <ArrowRight size={18} /></>}
          </motion.button>
        )}
      </div>
    </div>
  );
}

function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

function OrderList({ items, order, answered, move, setOrder }: {
  items: string[]; order: number[]; answered: boolean;
  move: (from: number, to: number) => void; setOrder: (o: number[]) => void;
}) {
  const dragging = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const onPointerDown = (e: React.PointerEvent, i: number) => {
    if (answered || (e.target as HTMLElement).closest('button')) return;
    dragging.current = i;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current === null || !listRef.current) return;
    const children = [...listRef.current.children] as HTMLElement[];
    const target = children.findIndex((c) => {
      const r = c.getBoundingClientRect();
      return e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (target >= 0 && target !== dragging.current) {
      const a = order.slice();
      const [it] = a.splice(dragging.current, 1);
      a.splice(target, 0, it);
      dragging.current = target;
      setOrder(a);
      play('tick');
    }
  };
  const onPointerUp = () => (dragging.current = null);

  return (
    <div className="order-list" ref={listRef}>
      {order.map((itemIdx, i) => (
        <motion.div
          layout
          key={itemIdx}
          className={`order-item ${answered ? (itemIdx === i ? 'correct' : 'wrong') : ''}`}
          onPointerDown={(e) => onPointerDown(e, i)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        >
          <GripVertical size={16} className="grip" />
          <span className="num">{i + 1}</span>
          <span><Markup text={items[itemIdx]} /></span>
          <span className="arrows">
            <button disabled={answered || i === 0} onClick={() => move(i, i - 1)} aria-label="Subir"><ArrowUp size={14} /></button>
            <button disabled={answered || i === order.length - 1} onClick={() => move(i, i + 1)} aria-label="Descer"><ArrowDown size={14} /></button>
          </span>
        </motion.div>
      ))}
      {answered && !order.every((v, i) => v === i) && (
        <div className="muted" style={{ fontSize: 14, marginTop: 6 }}>
          Ordem correta: {items.map((it, i) => `${i + 1}. ${it}`).join(' → ')}
        </div>
      )}
    </div>
  );
}

function Results({ pack, skill, result, answers, questions, onRetry }: {
  pack: Pack; skill: Skill; result: Result & { score: number; seconds: number };
  answers: boolean[]; questions: Prepared[]; onRetry: () => void;
}) {
  const pct = Math.round(result.score * 100);
  const [shown, setShown] = useState(0);
  const [xpShown, setXpShown] = useState(0);
  const r = 82;
  const c = 2 * Math.PI * r;

  useEffect(() => {
    const a = animate(0, pct, { duration: 1.4, ease: 'easeOut', onUpdate: (v) => setShown(Math.round(v)) });
    const b = animate(0, result.xp, { duration: 1.6, delay: 0.6, ease: 'easeOut', onUpdate: (v) => setXpShown(Math.round(v)) });
    return () => {
      a.stop();
      b.stop();
    };
  }, [pct, result.xp]);

  const title = result.passed
    ? result.perfect ? 'Perfeito absoluto!' : result.firstMastery ? 'Skill dominada!' : 'Passaste outra vez!'
    : 'Quase lá!';

  return (
    <motion.div className="glass results" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 20 }}>
      <div className="score-ring">
        <svg width="190" height="190" viewBox="0 0 190 190">
          <circle cx="95" cy="95" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="12" />
          <motion.circle
            cx="95" cy="95" r={r} fill="none" stroke={result.passed ? '#ffd200' : '#ff5d6c'} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - result.score) }}
            transition={{ duration: 1.4, ease: 'easeOut' }} transform="rotate(-90 95 95)"
            style={{ filter: `drop-shadow(0 0 12px ${result.passed ? 'rgba(255,210,0,.6)' : 'rgba(255,93,108,.5)'})` }}
          />
        </svg>
        <div className="val"><div>{shown}%<small>{answers.filter(Boolean).length} / {questions.length}</small></div></div>
      </div>
      <h1>{title}</h1>
      <p className="muted" style={{ margin: 0 }}>
        {result.passed
          ? result.firstMastery
            ? `Dominaste ${skill.title} em ${result.seconds}s.`
            : 'Treino concluído — o conhecimento fica mais sólido.'
          : `Precisas de ${Math.round(skill.quiz.passScore * 100)}%. Revê as lições e tenta outra vez — cada tentativa conta.`}
      </p>
      {result.xp > 0 && (
        <div className="xp-gain"><Sparkles size={24} /> +{xpShown} XP</div>
      )}
      {result.unlocked.length > 0 && (
        <>
          <div className="eyebrow" style={{ marginTop: 18 }}>Novas skills desbloqueadas</div>
          <div className="unlocked">
            {result.unlocked.map((s, i) => (
              <motion.span
                key={s.id}
                className="chip yellow"
                style={{ fontSize: 14, padding: '8px 14px' }}
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 1.2 + i * 0.15, type: 'spring' }}
              >
                <Icon name={s.icon} size={16} /> {s.title}
              </motion.span>
            ))}
          </div>
        </>
      )}
      <div className="review">
        {questions.map((p, i) => (
          <div className="review-item" key={i}>
            {answers[i] ? <CheckCircle2 size={18} color="var(--ok)" /> : <XCircle size={18} color="var(--bad)" />}
            <span><Markup text={p.q.prompt} /></span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn" onClick={onRetry}><RotateCcw size={18} /> {result.passed ? 'Treinar de novo' : 'Tentar outra vez'}</button>
        {!result.passed && (
          <button className="btn" onClick={() => { play('click'); navigate('learn', skill.id, 0); }}>Rever lições</button>
        )}
        <button className="btn btn-primary" onClick={() => { play('whoosh'); navigate('tree', ...(result.unlocked[0] ? [] : [skill.id])); }}>
          <Map size={18} /> {result.unlocked.length ? 'Ver o mapa' : 'Voltar ao mapa'}
        </button>
      </div>
      {skill.goal && result.firstMastery && (
        <button className="btn btn-primary btn-lg" style={{ marginTop: 16 }} onClick={() => navigate('profile')}>
          <Trophy size={20} /> Ver o teu certificado de {pack.goalTitle}
        </button>
      )}
    </motion.div>
  );
}
