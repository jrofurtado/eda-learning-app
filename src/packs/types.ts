/**
 * Learning pack schema. A pack is a self-contained skill tree that converges
 * on a final goal. New packs (e.g. "Data Engineering", "Cloud Security") only
 * need to implement `Pack` and be registered in `src/packs/index.ts`.
 *
 * Inline text in `p`, `list`, `callout`, prompts and explanations supports a
 * tiny markup: **bold**, `code` and *italic*.
 */

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'code'; code: string; lang?: string; caption?: string }
  /** Animated terminal session; `out` is printed after the command is "typed". */
  | { type: 'terminal'; lines: { cmd: string; out?: string }[] }
  | { type: 'callout'; variant: 'tip' | 'warn' | 'info'; title?: string; text: string }
  /** Horizontal flow of steps rendered as connected boxes. */
  | { type: 'flow'; steps: string[]; caption?: string }
  /** Two-column comparison table. */
  | { type: 'compare'; left: string; right: string; rows: [string, string][] }
  /** Inline knowledge check (not graded, gives a little XP). */
  | { type: 'quickcheck'; question: string; options: string[]; answer: number; explanation: string };

export type Question =
  | { kind: 'single'; prompt: string; code?: string; options: string[]; answer: number; explanation: string }
  | { kind: 'multi'; prompt: string; code?: string; options: string[]; answers: number[]; explanation: string }
  /** `items` is given in the CORRECT order; the UI shuffles it. */
  | { kind: 'order'; prompt: string; items: string[]; explanation: string }
  /** Free text answer, compared after trimming, lowercasing and collapsing whitespace. */
  | { kind: 'input'; prompt: string; code?: string; accept: string[]; placeholder?: string; explanation: string };

export interface Lesson {
  id: string;
  title: string;
  /** Estimated reading time in minutes. */
  minutes: number;
  blocks: Block[];
}

export interface Skill {
  id: string;
  title: string;
  subtitle: string;
  /** Key into the icon map in `src/components/SkillIcon.tsx`. */
  icon: string;
  /** Row in the tree, 0 = foundations. The goal skill has the highest tier. */
  tier: number;
  /** Horizontal position hint within the tier, 0..1. */
  x: number;
  deps: string[];
  /** XP awarded for passing the final test. */
  xp: number;
  /** Brief description shown when exploring the roadmap. */
  summary: string;
  /** What will be covered — shown on the roadmap preview. */
  topics: string[];
  lessons: Lesson[];
  quiz: {
    /** Fraction of correct answers needed, e.g. 0.8. */
    passScore: number;
    /** How many questions to draw from the pool per attempt. */
    draw: number;
    questions: Question[];
  };
  /** Marks the final goal of the pack. */
  goal?: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Unlocked when all these skills are mastered. */
  skills: string[];
}

export interface Tier {
  name: string;
  description: string;
}

/** Career-style rank derived from how many skills are mastered. */
export interface Rank {
  title: string;
  minMastered: number;
}

export interface Pack {
  id: string;
  name: string;
  tagline: string;
  description: string;
  goalTitle: string;
  tiers: Tier[];
  skills: Skill[];
  milestones: Milestone[];
  ranks: Rank[];
}
