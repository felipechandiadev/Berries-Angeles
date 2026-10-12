import { FULL_PROFILE } from './profiles';
import { chance, intBetween, pick, type Rng } from './rng';

export type ClientTrayMove = {
  direction: 'OUT' | 'IN';
  trayName: string;
  quantity: number;
  createdAt: string;
};

/** @deprecated Pallets are no longer seeded; kept export for compatibility. */
export function planPallets(): never[] {
  return [];
}

export function planClientTrayMoves(input: {
  rng: Rng;
  trayNames: string[];
  asOf?: Date;
}): ClientTrayMove[] {
  const { rng, trayNames } = input;
  const asOf = input.asOf ?? new Date('2026-10-10T12:00:00');
  const out: ClientTrayMove[] = [];

  for (let i = 0; i < FULL_PROFILE.clientTrayMoves; i++) {
    const daysBack = intBetween(rng, 5, 280);
    const created = new Date(asOf);
    created.setDate(created.getDate() - daysBack);
    created.setHours(9 + intBetween(rng, 0, 6), intBetween(rng, 0, 59), 0, 0);
    out.push({
      direction: chance(rng, 0.55) ? 'OUT' : 'IN',
      trayName: pick(rng, trayNames),
      quantity: intBetween(rng, 5, 40),
      createdAt: created.toISOString(),
    });
  }

  return out;
}
