import { motion } from 'framer-motion';
import { Flame, Home, Map, Music, Trophy, User, Volume2, VolumeX } from 'lucide-react';
import { navigate } from '../lib/router';
import { levelInfo } from '../lib/progress';
import { actions, useGame } from '../lib/store';
import { play, setMusic, unlockAudio } from '../lib/sound';
import { Icon } from './Icon';

export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe566" />
          <stop offset="1" stopColor="#f0a500" />
        </linearGradient>
      </defs>
      <path d="M32 6 54 19v26L32 58 10 45V19z" fill="none" stroke="url(#bm)" strokeWidth="5" strokeLinejoin="round" />
      <path d="M32 20 43 26.5v13L32 46l-11-6.5v-13z" fill="url(#bm)" />
    </svg>
  );
}

export function LevelBadge({ xp, size = 42 }: { xp: number; size?: number }) {
  const { level, progress } = levelInfo(xp);
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  return (
    <div className="level-badge" style={{ width: size, height: size }} title={`Nível ${level}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r - 3} fill="url(#bm)" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffd200" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - progress) }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} transition={{ type: 'spring', stiffness: 60, damping: 16 }}
        />
      </svg>
      <span>{level}</span>
    </div>
  );
}

export const AVATARS = ['rocket', 'terminal', 'k8s', 'cloud', 'zap', 'gem', 'flame', 'crown'];

const avatarIcon: Record<string, string> = { rocket: 'deploy' };
export function Avatar({ id, size = 20 }: { id: string; size?: number }) {
  return <Icon name={avatarIcon[id] ?? id} size={size} />;
}

const NAV = [
  { id: '', label: 'Início', icon: Home },
  { id: 'tree', label: 'Skill Tree', icon: Map },
  { id: 'achievements', label: 'Conquistas', icon: Trophy },
  { id: 'profile', label: 'Perfil', icon: User },
];

export function TopBar({ route }: { route: string }) {
  const xp = useGame((s) => s.xp);
  const streak = useGame((s) => s.streak);
  const settings = useGame((s) => s.settings);
  const profile = useGame((s) => s.profile);
  const info = levelInfo(xp);
  const section = route === 'learn' || route === 'quiz' ? 'tree' : route;

  const go = (id: string) => {
    play('click');
    navigate(id);
  };

  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => go('')} onMouseEnter={() => play('hover')} aria-label="Início">
          <BrandMark />
          <span className="brand-name">
            <small>EDA</small>
            Skill<b>Quest</b>
          </span>
        </button>
        <nav className="nav">
          {NAV.map((n) => (
            <button key={n.id} className={section === n.id ? 'active' : ''} onClick={() => go(n.id)} onMouseEnter={() => play('hover')}>
              {section === n.id && <motion.span layoutId="navpill" className="nav-pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <n.icon size={16} /> {n.label}
            </button>
          ))}
        </nav>
        <div className="topbar-spacer" />
        <div className="hud">
          <div className={`streak ${streak.count ? '' : 'cold'}`} title="Dias seguidos a estudar">
            <Flame size={20} fill={streak.count ? 'currentColor' : 'none'} /> {streak.count}
            <span style={{ fontSize: 12, fontWeight: 600 }}>{streak.count === 1 ? 'dia' : 'dias'}</span>
          </div>
          <div className="xpbox">
            <div className="row">
              <span>NÍVEL {info.level}</span>
              <span><b>{info.current}</b> / {info.needed} XP</span>
            </div>
            <div className="progress-track">
              <motion.div className="progress-fill" initial={false} animate={{ width: `${info.progress * 100}%` }} transition={{ type: 'spring', stiffness: 60, damping: 18 }} />
            </div>
          </div>
          <LevelBadge xp={xp} />
          <button
            className={`icon-btn ${settings.music ? 'on' : ''}`}
            title={settings.music ? 'Desligar música ambiente' : 'Ligar música ambiente'}
            onClick={() => {
              unlockAudio();
              actions.toggleMusic();
              setMusic(!settings.music);
              play('click');
            }}
          >
            <Music size={18} />
          </button>
          <button
            className={`icon-btn ${settings.sound ? 'on' : ''}`}
            title={settings.sound ? 'Silenciar efeitos' : 'Ativar efeitos sonoros'}
            onClick={() => {
              unlockAudio();
              actions.toggleSound();
            }}
          >
            {settings.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {profile && (
            <button className="avatar" style={{ border: 0, cursor: 'pointer' }} onClick={() => go('profile')} title={profile.name}>
              <Avatar id={profile.avatar} />
            </button>
          )}
        </div>
      </header>
      <nav className="mobile-nav glass">
        {NAV.map((n) => (
          <button key={n.id} className={section === n.id ? 'active' : ''} onClick={() => go(n.id)}>
            <n.icon size={20} />
            {n.label}
          </button>
        ))}
      </nav>
    </>
  );
}
