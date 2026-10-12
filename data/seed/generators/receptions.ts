import {
  FULL_PROFILE,
  SEASON_DEFS,
  USER_NAMES,
  VARIETY_TRAY,
} from './profiles';
import { randomSeasonDate } from './calendar';
import {
  chance,
  floatBetween,
  intBetween,
  pick,
  pickWeighted,
  type Rng,
} from './rng';

export type GeneratedPack = {
  packNumber: number;
  variety: string;
  format: string;
  tray: string;
  trayLabel: string;
  traysQuantity: number;
  unitTrayWeightKg: number;
  traysTotalWeightKg: number;
  grossWeightKg: number;
  netWeightBeforeImpuritiesKg: number;
  netWeightKg: number;
  impurityPercent: number;
  pricePerKg: number;
  currency: 'CLP';
  totalToPay: number;
};

export type GeneratedReception = {
  seasonId: string;
  seasonYear: string;
  producerRut: string;
  userName: string;
  guideNumber: string;
  exchangeRate: number;
  totalCLPToPay: number;
  createdAt: string;
  notes?: string;
  paymentStatus: 'PENDING' | 'PAID_ON_RECEPTION';
  withOps: boolean;
  packs: GeneratedPack[];
};

/** defaultPriceCLP: precio base por kg (desde qualityPrices de la variedad). */
export type VarietyInfo = { name: string; defaultPriceCLP: number };
export type FormatInfo = { name: string };
export type TrayInfo = { name: string; weight: number };

const TRAY_LABELS: Record<string, string> = {
  AZUL: 'Bandeja Azul',
  ARANDANERA: 'Bandeja Arandanera',
  'NEGRA CHICA': 'Bandeja Negra Chica',
  ESPARRAGUERA: 'Caja Esparraguera',
};

function selectActiveProducers(rng: Rng, allRuts: string[]): string[] {
  const shuffled = [...allRuts];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(FULL_PROFILE.activeProducerCount, shuffled.length));
}

function producerWeights(active: string[]): number[] {
  return active.map((_, i) =>
    i < FULL_PROFILE.topProducerCount ? 8 - i : 1
  );
}

function buildPack(
  rng: Rng,
  packNumber: number,
  varieties: VarietyInfo[],
  formats: FormatInfo[],
  traysByName: Map<string, TrayInfo>
): GeneratedPack {
  const variety = pick(rng, varieties);
  const format = pick(rng, formats);
  const trayName = VARIETY_TRAY[variety.name] || pick(rng, [...traysByName.keys()]);
  const tray = traysByName.get(trayName) || { name: trayName, weight: 0.3 };
  const traysQuantity = intBetween(rng, 8, 36);
  const unitTrayWeightKg = tray.weight;
  const traysTotalWeightKg = Math.round(traysQuantity * unitTrayWeightKg * 1000) / 1000;
  const netWeightKg = floatBetween(rng, 80, 420, 1);
  const impurityPercent = floatBetween(rng, 1, 12, 2);
  const netWeightBeforeImpuritiesKg =
    Math.round((netWeightKg / (1 - impurityPercent / 100)) * 10) / 10;
  const grossWeightKg =
    Math.round((netWeightBeforeImpuritiesKg + traysTotalWeightKg) * 10) / 10;
  const priceJitter = floatBetween(rng, 0.85, 1.35, 3);
  const pricePerKg = Math.round(Math.max(400, variety.defaultPriceCLP * priceJitter));
  const totalToPay = Math.round(netWeightKg * pricePerKg);

  return {
    packNumber,
    variety: variety.name,
    format: format.name,
    tray: tray.name,
    trayLabel: TRAY_LABELS[tray.name] || tray.name,
    traysQuantity,
    unitTrayWeightKg,
    traysTotalWeightKg,
    grossWeightKg,
    netWeightBeforeImpuritiesKg,
    netWeightKg,
    impurityPercent,
    pricePerKg,
    currency: 'CLP',
    totalToPay,
  };
}

export function generateReceptions(input: {
  rng: Rng;
  producerRuts: string[];
  varieties: VarietyInfo[];
  formats: FormatInfo[];
  trays: TrayInfo[];
  asOf?: Date;
}): GeneratedReception[] {
  const { rng, varieties, formats, trays } = input;
  const asOf = input.asOf ?? new Date('2026-10-10T12:00:00');
  const traysByName = new Map(trays.map((t) => [t.name, t]));
  const active = selectActiveProducers(rng, input.producerRuts);
  const weights = producerWeights(active);
  const out: GeneratedReception[] = [];
  let guideSeq = 1;

  for (const season of SEASON_DEFS) {
    const count = FULL_PROFILE.receptionsBySeason[season.year] ?? 0;
    for (let i = 0; i < count; i++) {
      const producerRut = pickWeighted(rng, active, weights);
      const packCount = chance(rng, 0.55) ? 2 : chance(rng, 0.7) ? 1 : 3;
      const packs: GeneratedPack[] = [];
      for (let p = 1; p <= packCount; p++) {
        packs.push(buildPack(rng, p, varieties, formats, traysByName));
      }
      const totalCLPToPay = packs.reduce((s, p) => s + p.totalToPay, 0);
      const createdAt = randomSeasonDate(rng, season.startDate, season.endDate, asOf);
      const year = season.year;
      const guideNumber = `GR-${year}-${String(guideSeq++).padStart(4, '0')}`;

      out.push({
        seasonId: season.id,
        seasonYear: season.year,
        producerRut,
        userName: pick(rng, [...USER_NAMES]),
        guideNumber,
        exchangeRate: 0,
        totalCLPToPay,
        createdAt: createdAt.toISOString(),
        notes: chance(rng, 0.15) ? 'Lote generado (seed histórico).' : undefined,
        paymentStatus: chance(rng, FULL_PROFILE.paidOnReceptionRate)
          ? 'PAID_ON_RECEPTION'
          : 'PENDING',
        withOps: chance(rng, FULL_PROFILE.opsSubsetRate),
        packs,
      });
    }
  }

  out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return out;
}
