import { motion } from 'framer-motion';
import { Download, Pencil, Printer, RotateCcw, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Avatar, AVATARS, BrandMark } from '../components/TopBar';
import { Icon } from '../components/Icon';
import { currentRank, levelInfo, masteredCount, packProgress } from '../lib/progress';
import { play } from '../lib/sound';
import { actions, useGame } from '../lib/store';
import type { Pack } from '../packs/types';

export function ProfileView({ pack }: { pack: Pack }) {
  const state = useGame((s) => s);
  const pp = packProgress(state, pack.id);
  const lvl = levelInfo(state.xp);
  const { rank } = currentRank(pack, pp);
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.profile?.name ?? '');
  const goal = pack.skills.find((s) => s.goal);
  const goalDate = goal && pp.mastered[goal.id];
  const accuracy = state.stats.answered ? Math.round((state.stats.correct / state.stats.answered) * 100) : 0;

  const exportData = () => {
    const blob = new Blob([actions.exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `skillquest-progresso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    play('click');
  };

  const importData = async (f: File) => {
    try {
      actions.importJson(await f.text());
      play('unlock');
    } catch {
      play('wrong');
      alert('Ficheiro inválido.');
    }
  };

  return (
    <div className="page">
      <motion.div className="glass profile-head" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="profile-avatar"><Avatar id={state.profile?.avatar ?? 'rocket'} size={44} /></div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="eyebrow">{rank.title} · Nível {lvl.level}</div>
          {editing ? (
            <form
              style={{ display: 'flex', gap: 8, marginTop: 6 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) actions.setProfile(name.trim(), state.profile?.avatar ?? 'rocket');
                setEditing(false);
              }}
            >
              <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={32} />
              <button className="btn btn-primary">Guardar</button>
            </form>
          ) : (
            <h1>
              {state.profile?.name ?? 'Explorador'}{' '}
              <button className="icon-btn" style={{ display: 'inline-grid', verticalAlign: 'middle', width: 32, height: 32 }} onClick={() => setEditing(true)} title="Editar nome"><Pencil size={14} /></button>
            </h1>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {AVATARS.map((a) => (
              <button
                key={a}
                className={`avatar-opt ${state.profile?.avatar === a ? 'on' : ''}`}
                style={{ width: 38 }}
                onClick={() => { play('select'); actions.setProfile(state.profile?.name ?? 'Explorador', a); }}
                aria-label={`Avatar ${a}`}
              >
                <Avatar id={a} size={18} />
              </button>
            ))}
          </div>
        </div>
        <div style={{ minWidth: 220 }}>
          <div className="xpbox" style={{ display: 'block' }}>
            <div className="row"><span>NÍVEL {lvl.level}</span><span><b>{lvl.current}</b> / {lvl.needed} XP</span></div>
            <div className="progress-track"><motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${lvl.progress * 100}%` }} transition={{ duration: 1 }} /></div>
          </div>
        </div>
      </motion.div>

      <div className="grid-2">
        <div className="glass card">
          <h3>Estatísticas</h3>
          <div className="kv">
            <span>XP total</span><span>{state.xp.toLocaleString('pt-PT')}</span>
            <span>Skills dominadas</span><span>{masteredCount(pack, pp)} / {pack.skills.length}</span>
            <span>Lições concluídas</span><span>{state.stats.lessons}</span>
            <span>Respostas certas</span><span>{state.stats.correct} / {state.stats.answered} ({accuracy}%)</span>
            <span>Melhor combo</span><span>x{state.stats.bestCombo}</span>
            <span>Testes perfeitos</span><span>{state.stats.perfectQuizzes}</span>
            <span>Sequência atual / melhor</span><span>{state.streak.count} / {state.streak.best} dias</span>
            <span>Teste mais rápido</span><span>{state.stats.fastestPass !== null ? `${state.stats.fastestPass}s` : '—'}</span>
          </div>
        </div>
        <div className="glass card">
          <h3>Os teus dados</h3>
          <p className="muted" style={{ marginTop: -6, fontSize: 14 }}>
            Todo o progresso fica guardado no <b>localStorage</b> deste browser — nada sai do teu computador. Exporta um ficheiro para mudar de máquina ou fazer backup.
          </p>
          <div className="data-actions">
            <button className="btn btn-sm" onClick={exportData}><Download size={16} /> Exportar</button>
            <button className="btn btn-sm" onClick={() => fileRef.current?.click()}><Upload size={16} /> Importar</button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => {
                if (confirm('Apagar todo o progresso? Esta ação não pode ser desfeita.')) {
                  actions.reset();
                  play('fail');
                }
              }}
            >
              <RotateCcw size={16} /> Recomeçar
            </button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          </div>
          <h3 style={{ marginTop: 22 }}>Som</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }} className="muted">
            Volume
            <input
              type="range" min={0} max={1} step={0.05} value={state.settings.volume}
              onChange={(e) => actions.setVolume(Number(e.target.value))}
              onPointerUp={() => play('correct')}
              style={{ flex: 1, accentColor: '#ffd200' }}
            />
          </label>
        </div>
      </div>

      {goalDate ? (
        <motion.div className="cert" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="pack-glow" style={{ left: '50%', marginLeft: -180, right: 'auto' }} />
          <BrandMark size={56} />
          <div className="eyebrow" style={{ marginTop: 12 }}>Certificado de conclusão</div>
          <h2>{pack.goalTitle}</h2>
          <p style={{ fontSize: 18, margin: '6px 0' }}>atribuído a <b>{state.profile?.name}</b></p>
          <p className="muted">por dominar todas as {pack.skills.length} skills do pacote {pack.name} · {new Date(goalDate).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <button className="btn" style={{ marginTop: 14 }} onClick={() => window.print()}><Printer size={16} /> Imprimir</button>
        </motion.div>
      ) : (
        <div className="glass card" style={{ marginTop: 18, display: 'flex', gap: 18, alignItems: 'center' }}>
          <div className="panel-icon locked"><Icon name="crown" size={32} /></div>
          <div>
            <h3 style={{ margin: 0 }}>Certificado {pack.goalTitle}</h3>
            <p className="muted" style={{ margin: '4px 0 0' }}>Domina o objetivo final da skill tree para desbloquear o teu certificado.</p>
          </div>
        </div>
      )}
    </div>
  );
}
