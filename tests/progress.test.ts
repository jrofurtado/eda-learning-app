import { describe, expect, it } from 'vitest';
import devops from '../src/packs/devops';
import {
  emptyPackProgress, hydrate, levelInfo, newlyUnlocked, normalizeAnswer, recommendedSkill, skillStatus, touchStreak, xpForLevel,
} from '../src/lib/progress';

describe('levels', () => {
  it('maps XP to levels', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(levelInfo(0).level).toBe(1);
    expect(levelInfo(99).level).toBe(1);
    expect(levelInfo(100).level).toBe(2);
    expect(levelInfo(350)).toMatchObject({ level: 3, current: 50, needed: 300 });
  });
});

describe('skill tree', () => {
  const skill = (id: string) => devops.skills.find((s) => s.id === id)!;

  it('locks skills until all deps are mastered', () => {
    const pp = emptyPackProgress();
    expect(skillStatus(pp, skill('linux'))).toBe('available');
    expect(skillStatus(pp, skill('cloud'))).toBe('locked');
    pp.mastered.networking = 1;
    expect(skillStatus(pp, skill('cloud'))).toBe('locked');
    pp.mastered.linux = 1;
    expect(skillStatus(pp, skill('cloud'))).toBe('available');
  });

  it('reports newly unlocked skills', () => {
    const pp = emptyPackProgress();
    pp.mastered.linux = 1;
    const ids = newlyUnlocked(devops, pp, 'networking').map((s) => s.id).sort();
    expect(ids).toEqual(['cloud', 'docker']);
  });

  it('recommends in-progress skills first', () => {
    const pp = emptyPackProgress();
    expect(recommendedSkill(devops, pp)?.tier).toBe(0);
    pp.lessonsDone.git = ['x'];
    expect(recommendedSkill(devops, pp)?.id).toBe('git');
  });
});

describe('streak', () => {
  it('increments on consecutive days and resets after a gap', () => {
    let s = { count: 0, best: 0, last: '' };
    s = touchStreak(s, new Date(2026, 0, 1));
    s = touchStreak(s, new Date(2026, 0, 1));
    expect(s.count).toBe(1);
    s = touchStreak(s, new Date(2026, 0, 2));
    expect(s.count).toBe(2);
    s = touchStreak(s, new Date(2026, 0, 5));
    expect(s).toMatchObject({ count: 1, best: 2 });
  });
});

describe('misc', () => {
  it('normalizes typed answers', () => {
    expect(normalizeAnswer('  $ Git   STATUS ')).toBe('git status');
  });
  it('hydrates partial/old saves safely', () => {
    const s = hydrate({ xp: 42, packs: { devops: { mastered: { linux: 1 } } } });
    expect(s.xp).toBe(42);
    expect(s.packs.devops.lessonsDone).toEqual({});
    expect(s.settings.sound).toBe(true);
    expect(hydrate('garbage').xp).toBe(0);
  });
});
