import type { Rng } from './rng';
import { pickWeighted } from './rng';

/** Relative harvest density by month (1–12). Berries peak late spring–summer (Southern Hemisphere). */
const MONTH_WEIGHTS = [2, 3, 4, 3, 2, 1, 1, 1, 2, 3, 5, 6];

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

/**
 * Pick a random datetime within [start, end], biased by monthly harvest weights.
 * For the active season, clamp end to `asOf` (default now).
 */
export function randomSeasonDate(
  rng: Rng,
  startIso: string,
  endIso: string,
  asOf?: Date
): Date {
  const start = parseIsoDate(startIso);
  let end = parseIsoDate(endIso);
  if (asOf && asOf < end) end = asOf;
  if (end < start) return start;

  const candidates: Array<{ date: Date; weight: number }> = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
    const from = monthStart < start ? start : monthStart;
    const to = monthEnd > end ? end : monthEnd;
    if (from <= to) {
      candidates.push({
        date: from,
        weight: MONTH_WEIGHTS[cursor.getMonth()],
      });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  if (!candidates.length) return start;

  const monthPick = pickWeighted(
    rng,
    candidates,
    candidates.map((c) => c.weight)
  );
  const monthEnd = new Date(
    monthPick.date.getFullYear(),
    monthPick.date.getMonth() + 1,
    0,
    23,
    59,
    59
  );
  const rangeStart = monthPick.date.getTime();
  const rangeEnd = Math.min(monthEnd.getTime(), end.getTime());
  const ts = rangeStart + rng() * Math.max(1, rangeEnd - rangeStart);
  const result = new Date(ts);
  // Business hours-ish
  result.setHours(7 + Math.floor(rng() * 10), Math.floor(rng() * 60), 0, 0);
  return result;
}
