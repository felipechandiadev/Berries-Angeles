import { FULL_PROFILE } from './profiles';
import { pick, type Rng } from './rng';
import type { GeneratedReception } from './receptions';
import type { GeneratedAdvance } from './advances';

export type SettlementPlan = {
  /** Indices into inserted reception rows that should get RECEPTION_TO_SETTLEMENT */
  settledReceptionGuideNumbers: string[];
  /** Advances fully or partially applied: producer+createdAt match keys after insert */
  advanceApplications: Array<{
    producerRut: string;
    createdAt: string;
    amount: number;
  }>;
};

/**
 * Pick a subset of PENDING (not paid-on-reception) receptions and some advances
 * to mark as settled via transaction_relations only.
 */
export function planSettlements(input: {
  rng: Rng;
  receptions: GeneratedReception[];
  advances: GeneratedAdvance[];
}): SettlementPlan {
  const { rng, receptions, advances } = input;

  const settleable = receptions.filter((r) => r.paymentStatus === 'PENDING');
  const settledReceptionGuideNumbers: string[] = [];
  const used = new Set<number>();
  const target = Math.min(FULL_PROFILE.settledReceptionsCount, settleable.length);

  while (settledReceptionGuideNumbers.length < target && used.size < settleable.length) {
    const idx = Math.floor(rng() * settleable.length);
    if (used.has(idx)) continue;
    used.add(idx);
    settledReceptionGuideNumbers.push(settleable[idx].guideNumber);
  }

  const advanceApplications: SettlementPlan['advanceApplications'] = [];
  const advTarget = Math.min(FULL_PROFILE.settledAdvancesCount, advances.length);
  const advUsed = new Set<number>();
  while (advanceApplications.length < advTarget && advUsed.size < advances.length) {
    const idx = Math.floor(rng() * advances.length);
    if (advUsed.has(idx)) continue;
    advUsed.add(idx);
    const adv = advances[idx];
    const applyFull = rng() < 0.6;
    const amount = applyFull
      ? adv.amount
      : Math.max(50_000, Math.floor(adv.amount * (0.3 + rng() * 0.5)));
    advanceApplications.push({
      producerRut: adv.producerRut,
      createdAt: adv.createdAt,
      amount,
    });
  }

  // Touch pick to keep API symmetric if we later need random child notes
  void pick;

  return { settledReceptionGuideNumbers, advanceApplications };
}
