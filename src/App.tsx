import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { Background } from './components/Background';
import { Onboarding } from './components/Onboarding';
import { Overlays } from './components/Overlays';
import { TopBar } from './components/TopBar';
import { useRoute } from './lib/router';
import { configureSound, setMusic, unlockAudio } from './lib/sound';
import { useGame } from './lib/store';
import { getPack, packs } from './packs';
import { AchievementsView } from './views/AchievementsView';
import { HomeView } from './views/HomeView';
import { LessonView } from './views/LessonView';
import { ProfileView } from './views/ProfileView';
import { QuizView } from './views/QuizView';
import { SkillTreeView } from './views/SkillTree';

export function App() {
  const [section = '', a, b] = useRoute();
  const activePack = useGame((s) => s.activePack);
  const profile = useGame((s) => s.profile);
  const settings = useGame((s) => s.settings);
  const pack = getPack(activePack) ?? packs[0];

  useEffect(() => configureSound(settings), [settings]);

  // Music needs a user gesture; resume it on the first interaction if it was on.
  useEffect(() => {
    const first = () => {
      unlockAudio();
      if (settings.music) setMusic(true);
    };
    window.addEventListener('pointerdown', first, { once: true });
    return () => window.removeEventListener('pointerdown', first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skill = a ? pack.skills.find((s) => s.id === a) : undefined;
  let view: React.ReactNode;
  switch (section) {
    case 'tree':
      view = <SkillTreeView pack={pack} openSkill={a} />;
      break;
    case 'learn':
      view = skill ? <LessonView pack={pack} skill={skill} index={Number(b) || 0} /> : <SkillTreeView pack={pack} />;
      break;
    case 'quiz':
      view = skill ? <QuizView pack={pack} skill={skill} /> : <SkillTreeView pack={pack} />;
      break;
    case 'achievements':
      view = <AchievementsView pack={pack} />;
      break;
    case 'profile':
      view = <ProfileView pack={pack} />;
      break;
    default:
      view = <HomeView pack={pack} />;
  }

  // The tree keeps one instance while the skill panel opens/closes over it.
  const viewKey = section === 'tree' ? 'tree' : section === 'learn' ? `learn/${a}/${b}` : `${section}/${a ?? ''}`;

  return (
    <div className="app">
      <Background />
      <TopBar route={section} />
      <AnimatePresence mode="wait">
        <motion.main
          key={viewKey}
          // opacity only: a transform/filter here would break the tree's position: fixed
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {view}
        </motion.main>
      </AnimatePresence>
      <Overlays />
      <AnimatePresence>{!profile && <Onboarding />}</AnimatePresence>
    </div>
  );
}
