import { useSyncExternalStore } from 'react';
import { packs, getPack } from '../packs';
import type { Skill } from '../packs/types';
import { allAchievements, type Achievement } from './achievements';
import {
  emptyPackProgress,
  hydrate,
  initialState,
  levelInfo,
  newlyUnlocked,
  touchStreak,
  type AppState,
  type PackProgress,
} from './progress';

const KEY = 'eda-skillquest:v1';

export type GameEvent =
  | { type: 'achievement'; achievement: Achievement }
  | { type: 'levelup'; level: number }
  | { type: 'xp'; amount: number; reason: string };

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? hydrate(JSON.parse(raw)) : initialState();
  } catch {
    return initialState();
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();
const eventListeners = new Set<(e: GameEvent) => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked — the game still works for this session */
  }
}

function emit(e: GameEvent) {
  eventListeners.forEach((l) => l(e));
}

export function onGameEvent(fn: (e: GameEvent) => void) {
  eventListeners.add(fn);
  return () => {
    eventListeners.delete(fn);
  };
}

export function getState() {
  return state;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useGame<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

/**
 * Apply a mutation, then award achievements and detect level ups.
 * `xpGain` is added to the total and announced as a floating XP event.
 */
function commit(next: AppState, xpGain = 0, reason = '') {
  const before = levelInfo(state.xp).level;
  next = { ...next, xp: next.xp + xpGain };
  if (xpGain > 0) emit({ type: 'xp', amount: xpGain, reason });

  // Achievements can cascade (e.g. XP from one unlocks a level achievement).
  const unlocked: Achievement[] = [];
  for (let guard = 0; guard < 5; guard++) {
    const fresh = allAchievements(packs).filter((a) => !next.achievements[a.id] && a.check(next, packs));
    if (!fresh.length) break;
    const achievements = { ...next.achievements };
    let bonus = 0;
    for (const a of fresh) {
      achievements[a.id] = Date.now();
      bonus += a.xp;
      unlocked.push(a);
    }
    next = { ...next, achievements, xp: next.xp + bonus };
  }

  state = next;
  persist();
  listeners.forEach((l) => l());
  unlocked.forEach((a) => emit({ type: 'achievement', achievement: a }));
  const after = levelInfo(state.xp).level;
  if (after > before) emit({ type: 'levelup', level: after });
}

function withPack(s: AppState, packId: string, fn: (p: PackProgress) => PackProgress): AppState {
  const cur = s.packs[packId] ?? emptyPackProgress();
  return { ...s, packs: { ...s.packs, [packId]: fn(cur) } };
}

function active(s: AppState): AppState {
  return { ...s, streak: touchStreak(s.streak) };
}

function answer(s: AppState, correct: boolean): AppState {
  const combo = correct ? s.stats.combo + 1 : 0;
  return {
    ...s,
    stats: {
      ...s.stats,
      answered: s.stats.answered + 1,
      correct: s.stats.correct + (correct ? 1 : 0),
      combo,
      bestCombo: Math.max(s.stats.bestCombo, combo),
    },
  };
}

export const XP = { lesson: 20, quickcheck: 5, perfectBonus: 0.5 } as const;

export const actions = {
  setProfile(name: string, avatar: string) {
    commit(active({ ...state, profile: { name, avatar, createdAt: state.profile?.createdAt ?? Date.now() } }));
  },

  setActivePack(packId: string) {
    commit({ ...state, activePack: packId });
  },

  markViewed(packId: string, skillId: string) {
    if (state.packs[packId]?.viewed[skillId]) return;
    commit(withPack(state, packId, (p) => ({ ...p, viewed: { ...p.viewed, [skillId]: true } })));
  },

  completeLesson(packId: string, skillId: string, lessonId: string) {
    const done = state.packs[packId]?.lessonsDone[skillId] ?? [];
    if (done.includes(lessonId)) {
      commit(active(state));
      return;
    }
    let next = withPack(state, packId, (p) => ({
      ...p,
      lessonsDone: { ...p.lessonsDone, [skillId]: [...done, lessonId] },
    }));
    next = active({ ...next, stats: { ...next.stats, lessons: next.stats.lessons + 1 } });
    commit(next, XP.lesson, 'Lição concluída');
  },

  /** Returns true if this is the first time the check is answered. */
  answerQuickcheck(packId: string, key: string, correct: boolean): boolean {
    if (key in (state.packs[packId]?.quickchecks ?? {})) return false;
    let next = withPack(state, packId, (p) => ({ ...p, quickchecks: { ...p.quickchecks, [key]: correct } }));
    next = answer(next, correct);
    commit(next, correct ? XP.quickcheck : 0, 'Verificação rápida');
    return true;
  },

  answerQuestion(correct: boolean) {
    commit(answer(state, correct));
  },

  finishQuiz(packId: string, skill: Skill, score: number, seconds: number) {
    const pack = getPack(packId)!;
    const pp = state.packs[packId] ?? emptyPackProgress();
    const passed = score >= skill.quiz.passScore;
    const firstMastery = passed && !pp.mastered[skill.id];
    const unlocked = firstMastery ? newlyUnlocked(pack, pp, skill.id) : [];
    const perfect = score === 1;

    let next = withPack(state, packId, (p) => ({
      ...p,
      quizAttempts: { ...p.quizAttempts, [skill.id]: (p.quizAttempts[skill.id] ?? 0) + 1 },
      quizFails: passed ? p.quizFails : { ...p.quizFails, [skill.id]: (p.quizFails[skill.id] ?? 0) + 1 },
      quizBest: { ...p.quizBest, [skill.id]: Math.max(p.quizBest[skill.id] ?? 0, score) },
      mastered: firstMastery ? { ...p.mastered, [skill.id]: Date.now() } : p.mastered,
    }));
    next = active({
      ...next,
      stats: {
        ...next.stats,
        perfectQuizzes: next.stats.perfectQuizzes + (perfect ? 1 : 0),
        comebacks: next.stats.comebacks + (firstMastery && (pp.quizFails[skill.id] ?? 0) > 0 ? 1 : 0),
        fastestPass: passed ? Math.min(next.stats.fastestPass ?? Infinity, seconds) : next.stats.fastestPass,
      },
    });

    // Full XP on first mastery; retakes give a small practice reward.
    let xp = 0;
    if (firstMastery) xp = skill.xp + (perfect ? Math.round(skill.xp * XP.perfectBonus) : 0);
    else if (passed) xp = Math.round(skill.xp * 0.1);
    commit(next, xp, firstMastery ? 'Skill dominada' : 'Treino');
    return { passed, perfect, xp, firstMastery, unlocked };
  },

  toggleSound() {
    commit({ ...state, settings: { ...state.settings, sound: !state.settings.sound } });
  },
  toggleMusic() {
    commit({ ...state, settings: { ...state.settings, music: !state.settings.music } });
  },
  setVolume(volume: number) {
    commit({ ...state, settings: { ...state.settings, volume } });
  },

  exportJson(): string {
    return JSON.stringify(state, null, 2);
  },
  importJson(json: string) {
    state = hydrate(JSON.parse(json));
    persist();
    listeners.forEach((l) => l());
  },
  reset() {
    state = { ...initialState(), settings: state.settings };
    persist();
    listeners.forEach((l) => l());
  },
};
