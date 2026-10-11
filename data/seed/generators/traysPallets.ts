import { FULL_PROFILE } from './profiles';
import { chance, intBetween, pick, type Rng } from './rng';
import type { GeneratedReception } from './receptions';

export type PalletPlan = {
  storageId: string;
  trayName: string;
  traysQuantity: number;
  capacity: number;
  weightKg: number;
  dispatchWeightKg: number;
  status: 'AVAILABLE' | 'CLOSED' | 'FULL' | 'DISPATCHED';
  createdAt: string;
  batchCode: string;
};

export type ClientTrayMove = {
  direction: 'OUT' | 'IN';
  trayName: string;
  quantity: number;
  createdAt: string;
};

export function planPallets(input: {
  rng: Rng;
  storageIds: string[];
  trayNames: string[];
  receptionsWithOps: GeneratedReception[];
}): PalletPlan[] {
  const { rng, storageIds, trayNames, receptionsWithOps } = input;
  const count = Math.min(FULL_PROFILE.palletTarget, Math.max(10, receptionsWithOps.length));
  const out: PalletPlan[] = [];

  for (let i = 0; i < count; i++) {
    const trayName = pick(rng, trayNames);
    const capacity = pick(rng, [30, 40, 48, 60]);
    const traysQuantity = intBetween(rng, Math.floor(capacity * 0.3), capacity);
    const statusRoll = rng();
    const status: PalletPlan['status'] =
      statusRoll < 0.25
        ? 'AVAILABLE'
        : statusRoll < 0.5
          ? 'CLOSED'
          : statusRoll < 0.8
            ? 'FULL'
            : 'DISPATCHED';
    const weightKg = Math.round(traysQuantity * (trayName === 'ESPARRAGUERA' ? 12 : 8) * 10) / 10;
    const createdAt =
      receptionsWithOps[i % Math.max(1, receptionsWithOps.length)]?.createdAt ||
      new Date().toISOString();

    out.push({
      storageId: pick(rng, storageIds),
      trayName,
      traysQuantity: status === 'AVAILABLE' ? Math.min(traysQuantity, capacity - 2) : traysQuantity,
      capacity,
      weightKg,
      dispatchWeightKg: status === 'DISPATCHED' ? weightKg : 0,
      status,
      createdAt,
      batchCode: `PAL-SEED-${String(1000 + i)}`,
    });
  }

  return out;
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
