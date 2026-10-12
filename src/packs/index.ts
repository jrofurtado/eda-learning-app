import type { Pack } from './types';
import devops from './devops';

/** Installed learning packs. Add new packs here. */
export const packs: Pack[] = [devops];

export function getPack(id: string): Pack | undefined {
  return packs.find((p) => p.id === id);
}
