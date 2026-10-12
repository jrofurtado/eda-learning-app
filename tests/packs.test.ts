import { describe, expect, it } from 'vitest';
import { packs } from '../src/packs';
import type { Skill } from '../src/packs/types';

describe.each(packs.map((p) => [p.id, p] as const))('pack %s', (_id, pack) => {
  const ids = new Set(pack.skills.map((s) => s.id));

  it('has unique skill ids and valid dependencies', () => {
    expect(ids.size).toBe(pack.skills.length);
    for (const s of pack.skills) for (const d of s.deps) expect(ids, `${s.id} -> ${d}`).toContain(d);
  });

  it('dependencies always point to a lower tier (acyclic)', () => {
    const byId = Object.fromEntries(pack.skills.map((s) => [s.id, s]));
    for (const s of pack.skills) for (const d of s.deps) expect(byId[d].tier, `${s.id} -> ${d}`).toBeLessThan(s.tier);
  });

  it('has exactly one goal, reachable from every skill', () => {
    const goals = pack.skills.filter((s) => s.goal);
    expect(goals).toHaveLength(1);
    // every non-goal skill must be a (transitive) prerequisite of the goal
    const needed = new Set<string>();
    const walk = (s: Skill) => s.deps.forEach((d) => { needed.add(d); walk(pack.skills.find((x) => x.id === d)!); });
    walk(goals[0]);
    for (const s of pack.skills) if (!s.goal) expect(needed, s.id).toContain(s.id);
  });

  it('milestones reference existing skills and tiers exist', () => {
    for (const m of pack.milestones) for (const s of m.skills) expect(ids).toContain(s);
    for (const s of pack.skills) expect(pack.tiers[s.tier], s.id).toBeDefined();
  });

  it.each(pack.skills.map((s) => [s.id, s] as const))('skill %s has well-formed content', (_sid, s) => {
    expect(s.lessons.length).toBeGreaterThan(0);
    expect(new Set(s.lessons.map((l) => l.id)).size).toBe(s.lessons.length);
    for (const l of s.lessons) {
      expect(l.blocks.length).toBeGreaterThan(0);
      for (const b of l.blocks) {
        if (b.type === 'quickcheck') {
          expect(b.answer).toBeGreaterThanOrEqual(0);
          expect(b.answer).toBeLessThan(b.options.length);
        }
      }
    }
    expect(s.quiz.questions.length).toBeGreaterThanOrEqual(s.quiz.draw);
    for (const q of s.quiz.questions) {
      expect(q.explanation.length).toBeGreaterThan(0);
      if (q.kind === 'single') expect(q.answer).toBeLessThan(q.options.length);
      if (q.kind === 'multi') {
        expect(q.answers.length).toBeGreaterThan(0);
        for (const a of q.answers) expect(a).toBeLessThan(q.options.length);
      }
      if (q.kind === 'order') expect(q.items.length).toBeGreaterThanOrEqual(3);
      if (q.kind === 'input') expect(q.accept.length).toBeGreaterThan(0);
    }
  });
});
