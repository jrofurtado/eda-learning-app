import type { Pack } from '../packs/types';
import { levelInfo, packProgress, type AppState } from './progress';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: Rarity;
  xp: number;
  /** Hidden achievements show "???" until unlocked. */
  secret?: boolean;
  check: (s: AppState, packs: Pack[]) => boolean;
  /** Optional progress indicator 0..1 for the achievements page. */
  progress?: (s: AppState, packs: Pack[]) => number;
}

const allLessons = (packs: Pack[]) => packs.reduce((n, p) => n + p.skills.reduce((m, s) => m + s.lessons.length, 0), 0);
const totalMastered = (s: AppState) => Object.values(s.packs).reduce((n, p) => n + Object.keys(p.mastered).length, 0);
const totalViewed = (s: AppState, packs: Pack[]) =>
  packs.reduce((n, p) => n + p.skills.filter((sk) => packProgress(s, p.id).viewed[sk.id]).length, 0);
const totalSkills = (packs: Pack[]) => packs.reduce((n, p) => n + p.skills.length, 0);
const ratio = (a: number, b: number) => Math.min(1, a / Math.max(1, b));

export const globalAchievements: Achievement[] = [
  {
    id: 'first-steps', title: 'Primeiros Passos', description: 'Conclui a tua primeira lição.',
    icon: 'footprints', rarity: 'common', xp: 25,
    check: (s) => s.stats.lessons >= 1,
  },
  {
    id: 'explorer', title: 'Explorador', description: 'Espreita todas as skills do roadmap.',
    icon: 'compass', rarity: 'common', xp: 50,
    check: (s, p) => totalViewed(s, p) >= totalSkills(p),
    progress: (s, p) => ratio(totalViewed(s, p), totalSkills(p)),
  },
  {
    id: 'first-skill', title: 'Primeira Conquista', description: 'Domina a tua primeira skill.',
    icon: 'star', rarity: 'common', xp: 50,
    check: (s) => totalMastered(s) >= 1,
  },
  {
    id: 'bookworm', title: 'Rato de Biblioteca', description: 'Conclui 10 lições.',
    icon: 'book', rarity: 'rare', xp: 100,
    check: (s) => s.stats.lessons >= 10,
    progress: (s) => ratio(s.stats.lessons, 10),
  },
  {
    id: 'scholar', title: 'Erudito', description: 'Conclui todas as lições disponíveis.',
    icon: 'graduation', rarity: 'epic', xp: 300,
    check: (s, p) => s.stats.lessons >= allLessons(p),
    progress: (s, p) => ratio(s.stats.lessons, allLessons(p)),
  },
  {
    id: 'perfectionist', title: 'Perfeccionista', description: 'Acerta 100% num teste final.',
    icon: 'target', rarity: 'rare', xp: 100,
    check: (s) => s.stats.perfectQuizzes >= 1,
  },
  {
    id: 'flawless', title: 'Impecável', description: 'Consegue 5 testes perfeitos.',
    icon: 'gem', rarity: 'epic', xp: 250,
    check: (s) => s.stats.perfectQuizzes >= 5,
    progress: (s) => ratio(s.stats.perfectQuizzes, 5),
  },
  {
    id: 'on-fire', title: 'Em Chamas', description: 'Acerta 10 respostas seguidas.',
    icon: 'flame', rarity: 'rare', xp: 100,
    check: (s) => s.stats.bestCombo >= 10,
    progress: (s) => ratio(s.stats.bestCombo, 10),
  },
  {
    id: 'unstoppable', title: 'Imparável', description: 'Acerta 25 respostas seguidas.',
    icon: 'zap', rarity: 'epic', xp: 250,
    check: (s) => s.stats.bestCombo >= 25,
    progress: (s) => ratio(s.stats.bestCombo, 25),
  },
  {
    id: 'comeback', title: 'Persistente', description: 'Passa um teste em que já tinhas chumbado.',
    icon: 'rotate', rarity: 'rare', xp: 75,
    check: (s) => s.stats.comebacks >= 1,
  },
  {
    id: 'lightning', title: 'Relâmpago', description: 'Passa um teste final em menos de 90 segundos.',
    icon: 'timer', rarity: 'epic', xp: 150, secret: true,
    check: (s) => s.stats.fastestPass !== null && s.stats.fastestPass < 90,
  },
  {
    id: 'habit', title: 'Hábito', description: 'Estuda 3 dias seguidos.',
    icon: 'calendar', rarity: 'common', xp: 75,
    check: (s) => s.streak.best >= 3,
    progress: (s) => ratio(s.streak.best, 3),
  },
  {
    id: 'dedication', title: 'Dedicação', description: 'Estuda 7 dias seguidos.',
    icon: 'calendar-heart', rarity: 'epic', xp: 250,
    check: (s) => s.streak.best >= 7,
    progress: (s) => ratio(s.streak.best, 7),
  },
  {
    id: 'night-owl', title: 'Coruja Noturna', description: 'Estuda entre a meia-noite e as 5h.',
    icon: 'moon', rarity: 'rare', xp: 50, secret: true,
    check: () => new Date().getHours() < 5,
  },
  {
    id: 'level-5', title: 'Em Ascensão', description: 'Atinge o nível 5.',
    icon: 'trending', rarity: 'rare', xp: 0,
    check: (s) => levelInfo(s.xp).level >= 5,
    progress: (s) => ratio(levelInfo(s.xp).level, 5),
  },
  {
    id: 'level-10', title: 'Veterano', description: 'Atinge o nível 10.',
    icon: 'medal', rarity: 'legendary', xp: 0,
    check: (s) => levelInfo(s.xp).level >= 10,
    progress: (s) => ratio(levelInfo(s.xp).level, 10),
  },
];

/** Pack milestones become achievements too (rarity grows with size). */
export function milestoneAchievements(packs: Pack[]): Achievement[] {
  return packs.flatMap((pack) =>
    pack.milestones.map((m): Achievement => {
      const goal = m.skills.some((id) => pack.skills.find((s) => s.id === id)?.goal);
      return {
        id: `${pack.id}:${m.id}`,
        title: m.title,
        description: m.description,
        icon: m.icon,
        rarity: goal ? 'legendary' : m.skills.length >= 3 ? 'epic' : 'rare',
        xp: goal ? 500 : 150,
        check: (s) => m.skills.every((id) => packProgress(s, pack.id).mastered[id]),
        progress: (s) => ratio(m.skills.filter((id) => packProgress(s, pack.id).mastered[id]).length, m.skills.length),
      };
    }),
  );
}

export function allAchievements(packs: Pack[]): Achievement[] {
  return [...milestoneAchievements(packs), ...globalAchievements];
}

export const rarityLabel: Record<Rarity, string> = {
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};
