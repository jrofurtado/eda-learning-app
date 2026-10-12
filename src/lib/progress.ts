import type { Pack, Skill } from '../packs/types';

/** Everything persisted to localStorage. Bump `version` and add a migration when the shape changes. */
export interface PackProgress {
  /** skillId -> completed lesson ids */
  lessonsDone: Record<string, string[]>;
  /** `${skillId}/${lessonId}/${blockIndex}` -> answered correctly at first try */
  quickchecks: Record<string, boolean>;
  /** skillId -> best score 0..1 */
  quizBest: Record<string, number>;
  quizAttempts: Record<string, number>;
  quizFails: Record<string, number>;
  /** skillId -> timestamp mastered */
  mastered: Record<string, number>;
  /** skills opened on the roadmap */
  viewed: Record<string, true>;
}

export interface AppState {
  version: 1;
  profile: { name: string; avatar: string; createdAt: number } | null;
  xp: number;
  activePack: string;
  packs: Record<string, PackProgress>;
  /** achievementId -> timestamp */
  achievements: Record<string, number>;
  streak: { count: number; best: number; last: string };
  stats: {
    answered: number;
    correct: number;
    combo: number;
    bestCombo: number;
    perfectQuizzes: number;
    lessons: number;
    fastestPass: number | null;
    comebacks: number;
  };
  settings: { sound: boolean; music: boolean; volume: number };
}

export function emptyPackProgress(): PackProgress {
  return { lessonsDone: {}, quickchecks: {}, quizBest: {}, quizAttempts: {}, quizFails: {}, mastered: {}, viewed: {} };
}

export function initialState(): AppState {
  return {
    version: 1,
    profile: null,
    xp: 0,
    activePack: 'devops',
    packs: {},
    achievements: {},
    streak: { count: 0, best: 0, last: '' },
    stats: { answered: 0, correct: 0, combo: 0, bestCombo: 0, perfectQuizzes: 0, lessons: 0, fastestPass: null, comebacks: 0 },
    settings: { sound: true, music: false, volume: 0.7 },
  };
}

/** Merge a possibly older/partial persisted object onto the defaults. */
export function hydrate(raw: unknown): AppState {
  const base = initialState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppState>;
  const packs: Record<string, PackProgress> = {};
  for (const [id, p] of Object.entries(r.packs ?? {})) packs[id] = { ...emptyPackProgress(), ...p };
  return {
    ...base,
    ...r,
    version: 1,
    packs,
    streak: { ...base.streak, ...r.streak },
    stats: { ...base.stats, ...r.stats },
    settings: { ...base.settings, ...r.settings },
  };
}

// ---------- levels ----------

/** Total XP needed to reach `level` (level 1 = 0 XP). */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export function levelInfo(xp: number) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, current: xp - floor, needed: next - floor, progress: (xp - floor) / (next - floor) };
}

// ---------- skill tree ----------

export type SkillStatus = 'locked' | 'available' | 'progress' | 'mastered';

export function packProgress(state: AppState, packId: string): PackProgress {
  return state.packs[packId] ?? emptyPackProgress();
}

export function skillStatus(pp: PackProgress, skill: Skill): SkillStatus {
  if (pp.mastered[skill.id]) return 'mastered';
  const unlocked = skill.deps.every((d) => pp.mastered[d]);
  if (!unlocked) return 'locked';
  const started = (pp.lessonsDone[skill.id]?.length ?? 0) > 0 || (pp.quizAttempts[skill.id] ?? 0) > 0;
  return started ? 'progress' : 'available';
}

/** 0..1 completion of a skill: lessons count for 70%, test for 30%. */
export function skillCompletion(pp: PackProgress, skill: Skill): number {
  if (pp.mastered[skill.id]) return 1;
  const lessons = (pp.lessonsDone[skill.id]?.length ?? 0) / Math.max(1, skill.lessons.length);
  return Math.min(1, lessons) * 0.7;
}

export function masteredCount(pack: Pack, pp: PackProgress): number {
  return pack.skills.filter((s) => pp.mastered[s.id]).length;
}

export function currentRank(pack: Pack, pp: PackProgress) {
  const n = masteredCount(pack, pp);
  let idx = 0;
  pack.ranks.forEach((r, i) => {
    if (n >= r.minMastered) idx = i;
  });
  return { rank: pack.ranks[idx], index: idx, next: pack.ranks[idx + 1] ?? null, mastered: n };
}

/** Skills that become unlocked once `skillId` is mastered (given current progress). */
export function newlyUnlocked(pack: Pack, pp: PackProgress, skillId: string): Skill[] {
  const after = { ...pp.mastered, [skillId]: 1 };
  return pack.skills.filter(
    (s) => !after[s.id] && s.deps.includes(skillId) && s.deps.every((d) => after[d]),
  );
}

/** A sensible next skill to work on: in progress first, then available (lowest tier). */
export function recommendedSkill(pack: Pack, pp: PackProgress): Skill | null {
  const ranked = pack.skills
    .map((s) => ({ s, st: skillStatus(pp, s) }))
    .filter((x) => x.st === 'progress' || x.st === 'available')
    .sort((a, b) => (a.st === b.st ? a.s.tier - b.s.tier : a.st === 'progress' ? -1 : 1));
  return ranked[0]?.s ?? null;
}

// ---------- streak ----------

export function dayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function touchStreak(streak: AppState['streak'], now = new Date()): AppState['streak'] {
  const today = dayKey(now);
  if (streak.last === today) return streak;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const count = streak.last === dayKey(y) ? streak.count + 1 : 1;
  return { count, best: Math.max(streak.best, count), last: today };
}

// ---------- quiz helpers ----------

export function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/^\$\s*/, '');
}

export function shuffle<T>(arr: T[], rand = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
