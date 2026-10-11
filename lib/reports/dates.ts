export type DatePreset = 'today' | 'week' | 'month' | 'season' | 'custom';
export type ReportGranularity = 'auto' | 'day' | 'week' | 'month';
export type CompareWith = 'none' | 'previousPeriod' | 'samePeriodLastYear';

export const DATE_PRESET_OPTIONS: Array<{ id: DatePreset; label: string }> = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Últimos 7 días' },
  { id: 'month', label: 'Mes actual' },
  { id: 'custom', label: 'Personalizado' },
];

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dateRangeForPreset(preset: DatePreset): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === 'today') {
    const iso = toIsoDate(end);
    return { dateFrom: iso, dateTo: iso };
  }
  if (preset === 'week') {
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return { dateFrom: toIsoDate(start), dateTo: toIsoDate(end) };
  }
  // month / season / custom default to calendar month
  const start = new Date(end.getFullYear(), end.getMonth(), 1);
  return { dateFrom: toIsoDate(start), dateTo: toIsoDate(end) };
}

export function daysInRange(dateFrom: string, dateTo: string): number {
  const a = new Date(`${dateFrom}T00:00:00`);
  const b = new Date(`${dateTo}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1);
}

export function resolveGranularity(
  raw: unknown,
  dateFrom: string,
  dateTo: string
): 'day' | 'week' | 'month' {
  if (raw === 'day' || raw === 'week' || raw === 'month') return raw;
  const days = daysInRange(dateFrom, dateTo);
  if (days <= 45) return 'day';
  if (days <= 180) return 'week';
  return 'month';
}

export function compareDateRange(
  dateFrom: string,
  dateTo: string,
  compareWith: CompareWith
): { dateFrom: string; dateTo: string } | null {
  if (compareWith === 'none') return null;
  const from = new Date(`${dateFrom}T00:00:00`);
  const to = new Date(`${dateTo}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  const days = daysInRange(dateFrom, dateTo);

  if (compareWith === 'samePeriodLastYear') {
    const prevFrom = new Date(from);
    prevFrom.setFullYear(prevFrom.getFullYear() - 1);
    const prevTo = new Date(to);
    prevTo.setFullYear(prevTo.getFullYear() - 1);
    return { dateFrom: toIsoDate(prevFrom), dateTo: toIsoDate(prevTo) };
  }

  // previousPeriod: same length immediately before
  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - (days - 1));
  return { dateFrom: toIsoDate(prevFrom), dateTo: toIsoDate(prevTo) };
}

export function buildSummaryDelta(
  current: number,
  previous: number
): { current: number; previous: number; deltaPct: number | null } {
  if (!Number.isFinite(previous) || previous === 0) {
    return {
      current,
      previous,
      deltaPct: Number.isFinite(current) && current !== 0 ? 100 : null,
    };
  }
  return {
    current,
    previous,
    deltaPct: ((current - previous) / Math.abs(previous)) * 100,
  };
}

export function bucketKey(date: Date, grain: 'day' | 'week' | 'month'): string {
  if (grain === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  if (grain === 'week') {
    const tmp = new Date(date);
    tmp.setHours(0, 0, 0, 0);
    tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
    const week1 = new Date(tmp.getFullYear(), 0, 4);
    const weekNum =
      1 +
      Math.round(
        ((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
      );
    return `${tmp.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }
  return toIsoDate(date);
}
