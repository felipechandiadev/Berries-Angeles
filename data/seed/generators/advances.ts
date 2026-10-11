import { FULL_PROFILE, SEASON_DEFS, USER_NAMES } from './profiles';
import { randomSeasonDate } from './calendar';
import { chance, intBetween, pick, type Rng } from './rng';
import type { GeneratedReception } from './receptions';

export type GeneratedAdvance = {
  seasonId: string;
  producerRut: string;
  userName: string;
  amount: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CHECK';
  paymentDetails: {
    adminBankAccountNumber?: string;
    producerAccountId?: string;
    transactionId?: string;
    checkNumber?: string;
  };
  notes?: string;
  createdAt: string;
};

const BANK_ACCOUNTS = [
  '12345678901234567890',
  '09876543210987654321',
  '11223344556677889900',
];

export function generateAdvances(input: {
  rng: Rng;
  receptions: GeneratedReception[];
  asOf?: Date;
}): GeneratedAdvance[] {
  const { rng, receptions } = input;
  const asOf = input.asOf ?? new Date('2026-10-10T12:00:00');

  const byProducer = new Map<string, GeneratedReception[]>();
  receptions.forEach((r) => {
    const list = byProducer.get(r.producerRut) ?? [];
    list.push(r);
    byProducer.set(r.producerRut, list);
  });

  const activeRuts = [...byProducer.keys()];
  const out: GeneratedAdvance[] = [];
  let seq = 1;

  for (let i = 0; i < FULL_PROFILE.advancesCount; i++) {
    const producerRut = pick(rng, activeRuts);
    const producerRecs = byProducer.get(producerRut) ?? [];
    const season =
      producerRecs.length > 0
        ? SEASON_DEFS.find((s) => s.id === pick(rng, producerRecs).seasonId) ??
          pick(rng, [...SEASON_DEFS])
        : pick(rng, [...SEASON_DEFS]);

    const methodRoll = rng();
    const paymentMethod: GeneratedAdvance['paymentMethod'] =
      methodRoll < 0.35 ? 'CASH' : methodRoll < 0.75 ? 'TRANSFER' : 'CHECK';

    const amount = intBetween(rng, 150, 1800) * 1000;
    const createdAt = randomSeasonDate(rng, season.startDate, season.endDate, asOf);
    const paymentDetails: GeneratedAdvance['paymentDetails'] = {};

    if (paymentMethod === 'TRANSFER') {
      paymentDetails.adminBankAccountNumber = pick(rng, BANK_ACCOUNTS);
      paymentDetails.producerAccountId = `producer-account-${producerRut.replace(/\W/g, '')}`;
      paymentDetails.transactionId = `ANT-${season.year}-${String(seq).padStart(4, '0')}`;
    } else if (paymentMethod === 'CHECK') {
      paymentDetails.adminBankAccountNumber = pick(rng, BANK_ACCOUNTS);
      paymentDetails.checkNumber = `CH-${String(500000 + seq)}`;
    } else {
      paymentDetails.transactionId = `ANT-CASH-${season.year}-${String(seq).padStart(4, '0')}`;
    }

    out.push({
      seasonId: season.id,
      producerRut,
      userName: pick(rng, [...USER_NAMES]),
      amount,
      paymentMethod,
      paymentDetails,
      notes: chance(rng, 0.4) ? 'Anticipo seed histórico' : undefined,
      createdAt: createdAt.toISOString(),
    });
    seq++;
  }

  out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return out;
}
