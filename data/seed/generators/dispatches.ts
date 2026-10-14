import { FULL_PROFILE, SEASON_DEFS } from './profiles';
import { chance, floatBetween, intBetween, pick, type Rng } from './rng';

export type PlannedDispatchPallet = {
  emptyWeightKg: number;
  traysQuantity: number;
  grossWeightKg: number;
  fruitWeightKg: number;
};

export type PlannedDispatch = {
  customerId: string;
  customerName: string;
  trayName: string;
  seasonId: string;
  pricePerKgCLP: number;
  createdAt: string;
  pallets: PlannedDispatchPallet[];
};

type CustomerRef = { id: string; name: string };
type TrayRef = { name: string; weight: number };

function seasonIdForDate(date: Date): string {
  const year = String(date.getFullYear());
  const match = SEASON_DEFS.find((s) => s.year === year);
  return match?.id ?? SEASON_DEFS[SEASON_DEFS.length - 1].id;
}

function buildPallet(
  rng: Rng,
  unitTrayWeight: number,
): PlannedDispatchPallet {
  const emptyWeightKg = floatBetween(rng, 8, 14, 1);
  const traysQuantity = intBetween(rng, 12, 24);
  const fruitWeightKg = floatBetween(rng, 28, 55, 3);
  const traysKg = traysQuantity * unitTrayWeight;
  const grossWeightKg = Number(
    (emptyWeightKg + traysKg + fruitWeightKg).toFixed(3),
  );
  return {
    emptyWeightKg,
    traysQuantity,
    grossWeightKg,
    fruitWeightKg: Number(fruitWeightKg.toFixed(3)),
  };
}

/**
 * Planifica despachos históricos. Los pallets nacen solo aquí (no se siembran sueltos).
 * Target ~FULL_PROFILE.palletTarget pallets en ~15–20 despachos.
 */
export function planDispatches(input: {
  rng: Rng;
  customers: CustomerRef[];
  trays: TrayRef[];
  asOf?: Date;
}): PlannedDispatch[] {
  const { rng, customers, trays } = input;
  if (customers.length === 0 || trays.length === 0) return [];

  const asOf = input.asOf ?? new Date('2026-10-10T12:00:00');
  const targetPallets = FULL_PROFILE.palletTarget;
  const out: PlannedDispatch[] = [];
  let palletCount = 0;
  let guard = 0;

  while (palletCount < targetPallets && guard < 80) {
    guard += 1;
    const remaining = targetPallets - palletCount;
    const lineCount = Math.min(remaining, chance(rng, 0.35) ? 3 : chance(rng, 0.5) ? 2 : 1);
    const tray = pick(rng, trays);
    const unitTrayWeight = Number(tray.weight) || 0.3;
    const customer = pick(rng, customers);

    const daysBack = intBetween(rng, 3, 320);
    const created = new Date(asOf);
    created.setDate(created.getDate() - daysBack);
    created.setHours(8 + intBetween(rng, 0, 8), intBetween(rng, 0, 59), 0, 0);

    const pallets: PlannedDispatchPallet[] = [];
    for (let i = 0; i < lineCount; i++) {
      pallets.push(buildPallet(rng, unitTrayWeight));
    }

    out.push({
      customerId: customer.id,
      customerName: customer.name,
      trayName: tray.name,
      seasonId: seasonIdForDate(created),
      pricePerKgCLP: intBetween(rng, 1800, 4200),
      createdAt: created.toISOString(),
      pallets,
    });
    palletCount += pallets.length;
  }

  out.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return out;
}
