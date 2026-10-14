import { getDb } from '@/data/db';
import { Transaction, TransactionType } from '@/data/entities/Transaction';
import { bucketKey } from '../dates';

export type DispatchReportRow = {
  id: string;
  createdAt: Date;
  seasonId: string | null;
  customerName: string;
  fruitKg: number;
  palletsCount: number;
  traysTotal: number;
  saleTotalCLP: number;
};

export type DispatchFilters = {
  dateFrom: string;
  dateTo: string;
  seasonId?: string | null;
};

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseMetadata(raw: unknown): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, any>;
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') return raw as Record<string, any>;
  return {};
}

export async function fetchDispatchRows(
  filters: DispatchFilters,
): Promise<DispatchReportRow[]> {
  const db = await getDb();
  const qb = db
    .getRepository(Transaction)
    .createQueryBuilder('tx')
    .where('tx.type = :type', { type: TransactionType.DISPATCH })
    .andWhere('tx.deletedAt IS NULL')
    .andWhere('DATE(tx.createdAt) >= :dateFrom', { dateFrom: filters.dateFrom })
    .andWhere('DATE(tx.createdAt) <= :dateTo', { dateTo: filters.dateTo })
    .orderBy('tx.createdAt', 'DESC');

  if (filters.seasonId) {
    qb.andWhere('tx.seasonId = :seasonId', { seasonId: filters.seasonId });
  }

  const rows = await qb.getMany();

  return rows.map((tx) => {
    const metadata = parseMetadata(tx.metadata);
    const fruitKg = toNumber(
      metadata?.fruitKgTotal != null ? metadata.fruitKgTotal : tx.amount,
      0,
    );
    const pricePerKg = toNumber(metadata?.pricePerKgCLP, 0);
    const saleTotalCLP = toNumber(
      metadata?.saleTotalCLP != null
        ? metadata.saleTotalCLP
        : Math.round(pricePerKg * fruitKg),
      0,
    );
    return {
      id: String(tx.id),
      createdAt: tx.createdAt,
      seasonId: tx.seasonId ? String(tx.seasonId) : null,
      customerName: metadata?.customerName || 'Sin cliente',
      fruitKg,
      palletsCount: toNumber(metadata?.palletsCount, 0),
      traysTotal: toNumber(metadata?.traysTotal, 0),
      saleTotalCLP: Math.round(saleTotalCLP),
    };
  });
}

export function summarizeDispatches(rows: DispatchReportRow[]) {
  const dispatchCount = rows.length;
  const fruitKg = rows.reduce((s, r) => s + r.fruitKg, 0);
  const palletsCount = rows.reduce((s, r) => s + r.palletsCount, 0);
  const traysTotal = rows.reduce((s, r) => s + r.traysTotal, 0);
  const saleTotalCLP = rows.reduce((s, r) => s + r.saleTotalCLP, 0);
  const customerCount = new Set(rows.map((r) => r.customerName)).size;
  return {
    dispatchCount,
    customerCount,
    fruitKg: Math.round(fruitKg * 100) / 100,
    palletsCount: Math.round(palletsCount),
    traysTotal: Math.round(traysTotal),
    saleTotalCLP: Math.round(saleTotalCLP),
  };
}

export function bucketDispatchesByDate(
  rows: DispatchReportRow[],
  grain: 'day' | 'week' | 'month',
): Array<{
  x: string;
  count: number;
  fruitKg: number;
  saleTotalCLP: number;
  palletsCount: number;
}> {
  const map = new Map<
    string,
    { count: number; fruitKg: number; saleTotalCLP: number; palletsCount: number }
  >();
  rows.forEach((row) => {
    const key = bucketKey(new Date(row.createdAt), grain);
    const cur = map.get(key) ?? {
      count: 0,
      fruitKg: 0,
      saleTotalCLP: 0,
      palletsCount: 0,
    };
    cur.count += 1;
    cur.fruitKg += row.fruitKg;
    cur.saleTotalCLP += row.saleTotalCLP;
    cur.palletsCount += row.palletsCount;
    map.set(key, cur);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([x, v]) => ({
      x,
      count: v.count,
      fruitKg: Math.round(v.fruitKg * 100) / 100,
      saleTotalCLP: Math.round(v.saleTotalCLP),
      palletsCount: Math.round(v.palletsCount),
    }));
}

export function groupDispatchesByCustomer(rows: DispatchReportRow[], topN = 20) {
  const map = new Map<
    string,
    {
      customerName: string;
      count: number;
      fruitKg: number;
      palletsCount: number;
      traysTotal: number;
      saleTotalCLP: number;
    }
  >();
  rows.forEach((r) => {
    const key = r.customerName;
    const cur = map.get(key) ?? {
      customerName: key,
      count: 0,
      fruitKg: 0,
      palletsCount: 0,
      traysTotal: 0,
      saleTotalCLP: 0,
    };
    cur.count += 1;
    cur.fruitKg += r.fruitKg;
    cur.palletsCount += r.palletsCount;
    cur.traysTotal += r.traysTotal;
    cur.saleTotalCLP += r.saleTotalCLP;
    map.set(key, cur);
  });
  return Array.from(map.values())
    .map((v) => ({
      ...v,
      fruitKg: Math.round(v.fruitKg * 100) / 100,
      palletsCount: Math.round(v.palletsCount),
      traysTotal: Math.round(v.traysTotal),
      saleTotalCLP: Math.round(v.saleTotalCLP),
    }))
    .sort((a, b) => b.fruitKg - a.fruitKg)
    .slice(0, topN);
}
