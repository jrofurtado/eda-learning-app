import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle2, Copy, Info, Lightbulb, Play, RotateCcw, XCircle, Zap } from 'lucide-react';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { Markup } from '../lib/markup';
import { play } from '../lib/sound';
import type { Block } from '../packs/types';

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] as const },
};

export function Blocks({ blocks, quickcheckKey, onQuickcheck }: {
  blocks: Block[];
  quickcheckKey: (i: number) => string;
  onQuickcheck: (key: string, correct: boolean) => void;
}) {
  return (
    <div className="blocks">
      {blocks.map((b, i) => (
        <motion.div key={i} {...reveal}>
          <BlockView block={b} qkey={quickcheckKey(i)} onQuickcheck={onQuickcheck} />
        </motion.div>
      ))}
    </div>
  );
}

function BlockView({ block: b, qkey, onQuickcheck }: { block: Block; qkey: string; onQuickcheck: (k: string, c: boolean) => void }) {
  switch (b.type) {
    case 'p':
      return <p className="b-p"><Markup text={b.text} /></p>;
    case 'h':
      return <h3 className="b-h">{b.text}</h3>;
    case 'list':
      return (
        <ul className={`b-list ${b.ordered ? 'ol' : ''}`}>
          {b.items.map((it, i) => <li key={i}><Markup text={it} /></li>)}
        </ul>
      );
    case 'code':
      return <CodeBlock code={b.code} lang={b.lang} caption={b.caption} />;
    case 'terminal':
      return <Terminal lines={b.lines} />;
    case 'callout': {
      const I = b.variant === 'warn' ? AlertTriangle : b.variant === 'info' ? Info : Lightbulb;
      return (
        <div className={`callout ${b.variant}`}>
          <I className="ci" size={22} />
          <div>
            {b.title && <div className="ct">{b.title}</div>}
            <p><Markup text={b.text} /></p>
          </div>
        </div>
      );
    }
    case 'flow':
      return (
        <div>
          <div className="flow">
            {b.steps.map((s, i) => (
              <Fragment key={i}>
                {i > 0 && (
                  <motion.div className="flow-arrow" initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 * i }}>
                    <ArrowRight size={20} />
                  </motion.div>
                )}
                <motion.div
                  className="flow-step"
                  initial={{ opacity: 0, scale: 0.85, y: 10 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 * i, type: 'spring', stiffness: 260, damping: 20 }}
                >
                  <span className="n">{i + 1}</span>
                  <Markup text={s} />
                </motion.div>
              </Fragment>
            ))}
          </div>
          {b.caption && <div className="flow-caption">{b.caption}</div>}
        </div>
      );
    case 'compare':
      return (
        <div className="compare">
          <div className="compare-row head"><div>{b.left}</div><div>{b.right}</div></div>
          {b.rows.map(([l, r], i) => (
            <div className="compare-row" key={i}>
              <div><Markup text={l} /></div>
              <div><Markup text={r} /></div>
            </div>
          ))}
        </div>
      );
    case 'quickcheck':
      return <QuickCheck block={b} qkey={qkey} onAnswer={onQuickcheck} />;
  }
}

// ---------- code ----------

const KEYWORDS = new Set(
  ('if then else elif fi for in do done while case esac function return export local set echo sudo ' +
    'FROM RUN COPY CMD ENTRYPOINT WORKDIR ENV EXPOSE ARG USER AS ADD HEALTHCHECK LABEL VOLUME ' +
    'resource variable output provider module data terraform locals true false null const let var import from def class').split(' '),
);

/** A deliberately tiny highlighter: comments, strings, keys, numbers and keywords. */
export function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(#[^\n]*|\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(^[ \t-]*[\w.-]+(?=:\s|:$))|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]+\b)/gm;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const [t] = m;
    if (m[1]) {
      // `#` inside a URL or shell var like $# is not a comment; only treat as comment at line start or after space
      const prev = code[m.index - 1];
      if (m.index === 0 || prev === ' ' || prev === '\n' || prev === '\t') out.push(<span key={k++} className="tok-c">{t}</span>);
      else out.push(t);
    } else if (m[2]) out.push(<span key={k++} className="tok-s">{t}</span>);
    else if (m[3]) out.push(<span key={k++} className="tok-key">{t}</span>);
    else if (m[4]) out.push(<span key={k++} className="tok-n">{t}</span>);
    else if (m[5] && KEYWORDS.has(t)) out.push(<span key={k++} className="tok-k">{t}</span>);
    else out.push(t);
    last = m.index + t.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className="copy-btn"
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setOk(true);
        play('tick');
        setTimeout(() => setOk(false), 1400);
      }}
    >
      {ok ? <CheckCircle2 size={14} /> : <Copy size={14} />} {ok ? 'Copiado' : 'Copiar'}
    </button>
  );
}

function CodeBlock({ code, lang, caption }: { code: string; lang?: string; caption?: string }) {
  return (
    <div className="code-block">
      <div className="code-head">
        <span className="dots"><i /><i /><i /></span>
        {lang ?? 'code'}
        <span className="spacer" />
        <CopyButton text={code} />
      </div>
      <pre><code>{highlight(code)}</code></pre>
      {caption && <div className="code-caption"><Markup text={caption} /></div>}
    </div>
  );
}

// ---------- terminal ----------

function Terminal({ lines }: { lines: { cmd: string; out?: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0);
  const [started, setStarted] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const [showOut, setShowOut] = useState(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setStarted(true), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    if (reduced) {
      setLineIdx(lines.length);
      return;
    }
    if (lineIdx >= lines.length) return;
    const cmd = lines[lineIdx].cmd;
    if (chars < cmd.length) {
      const t = setTimeout(() => {
        setChars((c) => c + 1);
        if (chars % 2 === 0) play('tick');
      }, 22 + Math.random() * 35);
      return () => clearTimeout(t);
    }
    if (!showOut) {
      const t = setTimeout(() => setShowOut(true), 260);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setLineIdx((i) => i + 1);
      setChars(0);
      setShowOut(false);
    }, 600);
    return () => clearTimeout(t);
  }, [started, lineIdx, chars, showOut, lines, reduced, run]);

  const replay = () => {
    setLineIdx(0);
    setChars(0);
    setShowOut(false);
    setRun((r) => r + 1);
  };

  return (
    <div className="code-block terminal" ref={ref}>
      <div className="code-head">
        <span className="dots"><i /><i /><i /></span>
        terminal
        <span className="spacer" />
        <button className="copy-btn" onClick={replay}><RotateCcw size={14} /> Repetir</button>
        <CopyButton text={lines.map((l) => l.cmd).join('\n')} />
      </div>
      <pre>
        {lines.map((l, i) => {
          if (i > lineIdx) return null;
          const typing = i === lineIdx;
          const text = typing ? l.cmd.slice(0, chars) : l.cmd;
          return (
            <Fragment key={i}>
              <span className="term-prompt">eda@srv:~$ </span>
              {text}
              {typing && <span className="caret" />}
              {'\n'}
              {l.out && (!typing || showOut) && <span className="term-out">{l.out}{'\n'}</span>}
            </Fragment>
          );
        })}
        {!started && <span className="term-prompt"><Play size={12} /> </span>}
      </pre>
    </div>
  );
}

// ---------- quickcheck ----------

function QuickCheck({ block, qkey, onAnswer }: {
  block: Extract<Block, { type: 'quickcheck' }>;
  qkey: string;
  onAnswer: (k: string, c: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === block.answer;
  return (
    <div className="quickcheck">
      <div className="qh"><Zap size={14} /> Verificação rápida</div>
      <div className="qq"><Markup text={block.question} /></div>
      <div className="options">
        {block.options.map((o, i) => {
          const cls = answered ? (i === block.answer ? 'correct' : i === picked ? 'wrong' : '') : '';
          return (
            <motion.button
              key={i}
              className={`option ${cls}`}
              disabled={answered}
              whileTap={{ scale: 0.98 }}
              animate={answered && i === picked && !correct ? { x: [0, -8, 8, -5, 5, 0] } : {}}
              onMouseEnter={() => !answered && play('hover')}
              onClick={() => {
                setPicked(i);
                const ok = i === block.answer;
                play(ok ? 'correct' : 'wrong');
                onAnswer(qkey, ok);
              }}
            >
              <span className="key">{String.fromCharCode(65 + i)}</span>
              <span className="grow"><Markup text={o} /></span>
              {answered && i === block.answer && <CheckCircle2 size={20} color="var(--ok)" />}
              {answered && i === picked && !correct && <XCircle size={20} color="var(--bad)" />}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {answered && (
          <motion.div className={`explain ${correct ? 'ok' : 'bad'}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            {correct ? <CheckCircle2 className="ei" size={20} /> : <XCircle className="ei" size={20} />}
            <div>
              <b>{correct ? 'Certo!' : 'Quase…'}</b>
              <Markup text={block.explanation} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
