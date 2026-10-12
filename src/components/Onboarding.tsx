import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { burst } from '../lib/fx';
import { play, unlockAudio } from '../lib/sound';
import { actions } from '../lib/store';
import { Avatar, AVATARS, BrandMark } from './TopBar';

export function Onboarding() {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    unlockAudio();
    actions.setProfile(name.trim(), avatar);
    play('levelup');
    burst(0.5, 0.5, 1.4);
  };

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.form
        className="glass onboard"
        onSubmit={start}
        initial={{ y: 40, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -30, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.15 }}
      >
        <BrandMark size={48} />
        <div className="eyebrow" style={{ marginTop: 14 }}>Bem-vindo ao EDA SkillQuest</div>
        <h1>Cria o teu perfil de aventureiro</h1>
        <p className="muted" style={{ margin: 0 }}>
          Vais percorrer uma skill tree, desbloquear conquistas e subir de nível. O progresso fica guardado neste browser.
        </p>
        <div className="field">
          <label htmlFor="name">Como te chamas?</label>
          <input
            id="name"
            className="text-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="O teu nome"
            maxLength={32}
            autoFocus
            onFocus={unlockAudio}
          />
        </div>
        <div className="field">
          <label>Escolhe um avatar</label>
          <div className="avatars">
            {AVATARS.map((a) => (
              <motion.button
                type="button"
                key={a}
                className={`avatar-opt ${a === avatar ? 'on' : ''}`}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => { unlockAudio(); play('select'); setAvatar(a); }}
                aria-label={`Avatar ${a}`}
              >
                <Avatar id={a} size={24} />
              </motion.button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 28 }} disabled={!name.trim()}>
          Começar a aventura <ArrowRight size={20} />
        </button>
      </motion.form>
    </motion.div>
  );
}
