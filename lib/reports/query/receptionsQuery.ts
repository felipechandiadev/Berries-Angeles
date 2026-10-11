import { getDb } from '@/data/db';
import { Transaction, TransactionType } from '@/data/entities/Transaction';
import { normalizePaymentStatus } from '@/lib/receptionPayment';
import { bucketKey } from '../dates';

export type ReceptionReportRow = {
  id: string;
  createdAt: Date;
  seasonId: string | null;
  producerId: string | null;
  producerName: string;
  guideNumber: string;
  paymentStatus: 'PENDING' | 'PAID_ON_RECEPTION';
  totalTrays: number;
  grossWeightKg: number;
  netWeightKg: number;
  payableCLP: number;
  payableUSD: number;
  totalCLP: number;
  varieties: string[];
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

export type ReceptionFilters = {
  dateFrom: string;
  dateTo: string;
  seasonId?: string | null;
  producerId?: string | null;
  varietyId?: string | null;
  varietyName?: string | null;
  paymentStatus?: string | null;
};

export async function fetchReceptionRows(
  filters: ReceptionFilters
): Promise<ReceptionReportRow[]> {
  const db = await getDb();
  const qb = db
    .getRepository(Transaction)
    .createQueryBuilder('tx')
    .leftJoinAndSelect('tx.producer', 'producer')
    .where('tx.type = :type', { type: TransactionType.RECEPTION })
    .andWhere('tx.deletedAt IS NULL')
    .andWhere('DATE(tx.createdAt) >= :dateFrom', { dateFrom: filters.dateFrom })
    .andWhere('DATE(tx.createdAt) <= :dateTo', { dateTo: filters.dateTo })
    .orderBy('tx.createdAt', 'DESC');

  if (filters.seasonId) {
    qb.andWhere('tx.seasonId = :seasonId', { seasonId: filters.seasonId });
  }
  if (filters.producerId) {
    qb.andWhere('tx.producerId = :producerId', { producerId: filters.producerId });
  }

  const rows = await qb.getMany();

  const mapped: ReceptionReportRow[] = rows.map((tx) => {
    const metadata = parseMetadata(tx.metadata);
    const totals = metadata?.totals ?? {};
    const packs = Array.isArray(metadata?.packs) ? metadata.packs : [];
    const varieties = Array.from(
      new Set(
        packs
          .map((p: any) =>
            typeof p?.varietyName === 'string' ? p.varietyName.trim() : ''
          )
          .filter(Boolean)
      )
    );

    return {
      id: String(tx.id),
      createdAt: tx.createdAt,
      seasonId: tx.seasonId ? String(tx.seasonId) : null,
      producerId: tx.producerId ? String(tx.producerId) : null,
      producerName:
        metadata?.producerName || tx.producer?.name || 'Sin productor',
      guideNumber: metadata?.guideNumber || '—',
      paymentStatus: normalizePaymentStatus(metadata?.paymentStatus),
      totalTrays: toNumber(totals?.traysInPacks, 0),
      grossWeightKg: toNumber(totals?.grossWeightKg, 0),
      netWeightKg: toNumber(totals?.netWeightKg, 0),
      payableCLP: toNumber(totals?.payableCLP, 0),
      payableUSD: toNumber(totals?.payableUSD, 0),
      totalCLP: toNumber(totals?.totalCLPToPay ?? metadata?.totalCLPToPay, 0),
      varieties,
    };
  });

  return mapped.filter((row) => {
    if (filters.paymentStatus) {
      if (row.paymentStatus !== filters.paymentStatus) return false;
    }
    if (filters.varietyName) {
      const name = filters.varietyName.toLowerCase();
      if (!row.varieties.some((v) => v.toLowerCase() === name)) return false;
    }
    return true;
  });
}

export function summarizeReceptions(rows: ReceptionReportRow[]) {
  const receptionCount = rows.length;
  const totalTrays = rows.reduce((s, r) => s + r.totalTrays, 0);
  const grossWeightKg = rows.reduce((s, r) => s + r.grossWeightKg, 0);
  const netWeightKg = rows.reduce((s, r) => s + r.netWeightKg, 0);
  const totalCLP = rows.reduce((s, r) => s + r.totalCLP, 0);
  const payableCLP = rows.reduce((s, r) => s + r.payableCLP, 0);
  const payableUSD = rows.reduce((s, r) => s + r.payableUSD, 0);
  const paidCount = rows.filter((r) => r.paymentStatus === 'PAID_ON_RECEPTION').length;
  const pendingCount = receptionCount - paidCount;
  const producerCount = new Set(rows.map((r) => r.producerId || r.producerName)).size;
  const varietyCount = new Set(rows.flatMap((r) => r.varieties)).size;

  return {
    receptionCount,
    totalTrays,
    grossWeightKg: Math.round(grossWeightKg * 100) / 100,
    netWeightKg: Math.round(netWeightKg * 100) / 100,
    totalCLP: Math.round(totalCLP),
    payableCLP: Math.round(payableCLP),
    payableUSD: Math.round(payableUSD * 100) / 100,
    paidCount,
    pendingCount,
    producerCount,
    varietyCount,
    avgNetWeightKg:
      receptionCount > 0
        ? Math.round((netWeightKg / receptionCount) * 100) / 100
        : 0,
    paidPct: receptionCount > 0 ? Math.round((paidCount / receptionCount) * 1000) / 10 : 0,
  };
}

export function bucketReceptionsByDate(
  rows: ReceptionReportRow[],
  grain: 'day' | 'week' | 'month'
): Array<{ x: string; count: number; netWeightKg: number; totalCLP: number }> {
  const map = new Map<string, { count: number; netWeightKg: number; totalCLP: number }>();
  rows.forEach((row) => {
    const key = bucketKey(new Date(row.createdAt), grain);
    const cur = map.get(key) ?? { count: 0, netWeightKg: 0, totalCLP: 0 };
    cur.count += 1;
    cur.netWeightKg += row.netWeightKg;
    cur.totalCLP += row.totalCLP;
    map.set(key, cur);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([x, v]) => ({
      x,
      count: v.count,
      netWeightKg: Math.round(v.netWeightKg * 100) / 100,
      totalCLP: Math.round(v.totalCLP),
    }));
}

export function groupByProducer(rows: ReceptionReportRow[]) {
  const map = new Map<
    string,
    {
      producerId: string;
      producerName: string;
      receptionCount: number;
      totalTrays: number;
      netWeightKg: number;
      totalCLP: number;
    }
  >();
  rows.forEach((row) => {
    const key = row.producerId || row.producerName;
    const cur = map.get(key) ?? {
      producerId: row.producerId || '',
      producerName: row.producerName,
      receptionCount: 0,
      totalTrays: 0,
      netWeightKg: 0,
      totalCLP: 0,
    };
    cur.receptionCount += 1;
    cur.totalTrays += row.totalTrays;
    cur.netWeightKg += row.netWeightKg;
    cur.totalCLP += row.totalCLP;
    map.set(key, cur);
  });
  return Array.from(map.values())
    .map((r) => ({
      ...r,
      netWeightKg: Math.round(r.netWeightKg * 100) / 100,
      totalCLP: Math.round(r.totalCLP),
    }))
    .sort((a, b) => b.totalCLP - a.totalCLP);
}

export function groupByVariety(rows: ReceptionReportRow[]) {
  const map = new Map<
    string,
    { varietyName: string; receptionCount: number; netWeightKg: number; totalCLP: number }
  >();
  rows.forEach((row) => {
    const names = row.varieties.length ? row.varieties : ['Sin variedad'];
    names.forEach((varietyName) => {
      const cur = map.get(varietyName) ?? {
        varietyName,
        receptionCount: 0,
        netWeightKg: 0,
        totalCLP: 0,
      };
      cur.receptionCount += 1;
      cur.netWeightKg += row.netWeightKg / names.length;
      cur.totalCLP += row.totalCLP / names.length;
      map.set(varietyName, cur);
    });
  });
  return Array.from(map.values())
    .map((r) => ({
      ...r,
      netWeightKg: Math.round(r.netWeightKg * 100) / 100,
      totalCLP: Math.round(r.totalCLP),
    }))
    .sort((a, b) => b.netWeightKg - a.netWeightKg);
}
