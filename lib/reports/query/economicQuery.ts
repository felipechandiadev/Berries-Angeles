import { getDb } from '@/data/db';
import { Transaction, TransactionType } from '@/data/entities/Transaction';
import {
  TransactionRelation,
  TransactionRelationType,
} from '@/data/entities/TransactionRelation';
import { normalizePaymentStatus } from '@/lib/receptionPayment';
import { bucketKey } from '../dates';

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

export type EconomicFilters = {
  dateFrom: string;
  dateTo: string;
  seasonId?: string | null;
  producerId?: string | null;
};

export type PendingPayableRow = {
  id: string;
  createdAt: Date;
  seasonId: string | null;
  producerId: string | null;
  producerName: string;
  guideNumber: string;
  netWeightKg: number;
  totalCLP: number;
  ageDays: number;
};

export type SettlementReportRow = {
  id: string;
  createdAt: Date;
  seasonId: string | null;
  producerId: string | null;
  producerName: string;
  status: 'BORRADOR' | 'COMPLETA';
  paymentMethod: string;
  receptionsTotalCLP: number;
  advancesAppliedCLP: number;
  netAmountCLP: number;
  receptionCount: number;
};

export type AdvanceReportRow = {
  id: string;
  createdAt: Date;
  seasonId: string | null;
  producerId: string | null;
  producerName: string;
  amount: number;
  appliedAmount: number;
  availableAmount: number;
  status: 'ACTIVE' | 'APPLIED' | 'CANCELLED';
  paymentMethod: string;
};

function ageDays(from: Date): number {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - start.getTime()) / 86_400_000));
}

/** Recepciones PENDING sin liquidación, creadas en el período. */
export async function fetchPendingPayableRows(
  filters: EconomicFilters,
): Promise<PendingPayableRow[]> {
  const db = await getDb();
  const qb = db
    .getRepository(Transaction)
    .createQueryBuilder('reception')
    .leftJoinAndSelect('reception.producer', 'producer')
    .leftJoin(
      TransactionRelation,
      'settlementRelation',
      'settlementRelation.parentTransactionId = reception.id AND settlementRelation.relationType = :relationType',
      { relationType: TransactionRelationType.RECEPTION_TO_SETTLEMENT },
    )
    .where('reception.type = :type', { type: TransactionType.RECEPTION })
    .andWhere('reception.deletedAt IS NULL')
    .andWhere('settlementRelation.id IS NULL')
    .andWhere('DATE(reception.createdAt) >= :dateFrom', { dateFrom: filters.dateFrom })
    .andWhere('DATE(reception.createdAt) <= :dateTo', { dateTo: filters.dateTo })
    .orderBy('reception.createdAt', 'DESC');

  if (filters.seasonId) {
    qb.andWhere('reception.seasonId = :seasonId', { seasonId: filters.seasonId });
  }
  if (filters.producerId) {
    qb.andWhere('reception.producerId = :producerId', {
      producerId: filters.producerId,
    });
  }

  const rows = await qb.getMany();

  return rows
    .map((tx) => {
      const metadata = parseMetadata(tx.metadata);
      const paymentStatus = normalizePaymentStatus(metadata?.paymentStatus);
      if (paymentStatus === 'PAID_ON_RECEPTION') return null;
      const totals = metadata?.totals ?? {};
      return {
        id: String(tx.id),
        createdAt: tx.createdAt,
        seasonId: tx.seasonId ? String(tx.seasonId) : null,
        producerId: tx.producerId ? String(tx.producerId) : null,
        producerName:
          metadata?.producerName || tx.producer?.name || 'Sin productor',
        guideNumber: metadata?.guideNumber || '—',
        netWeightKg: toNumber(totals?.netWeightKg, 0),
        totalCLP: Math.round(
          toNumber(totals?.totalCLPToPay ?? metadata?.totalCLPToPay, 0),
        ),
        ageDays: ageDays(tx.createdAt),
      } satisfies PendingPayableRow;
    })
    .filter((r): r is PendingPayableRow => r != null);
}

export function summarizePendingPayable(rows: PendingPayableRow[]) {
  const receptionCount = rows.length;
  const totalCLP = rows.reduce((s, r) => s + r.totalCLP, 0);
  const netWeightKg = rows.reduce((s, r) => s + r.netWeightKg, 0);
  const producerCount = new Set(rows.map((r) => r.producerId || r.producerName)).size;
  const avgAgeDays =
    receptionCount > 0
      ? Math.round(rows.reduce((s, r) => s + r.ageDays, 0) / receptionCount)
      : 0;
  return {
    receptionCount,
    producerCount,
    totalCLP: Math.round(totalCLP),
    netWeightKg: Math.round(netWeightKg * 100) / 100,
    avgAgeDays,
  };
}

export function groupPendingByProducer(rows: PendingPayableRow[], topN = 20) {
  const map = new Map<
    string,
    { producerName: string; count: number; totalCLP: number; netWeightKg: number }
  >();
  rows.forEach((r) => {
    const key = r.producerId || r.producerName;
    const cur = map.get(key) ?? {
      producerName: r.producerName,
      count: 0,
      totalCLP: 0,
      netWeightKg: 0,
    };
    cur.count += 1;
    cur.totalCLP += r.totalCLP;
    cur.netWeightKg += r.netWeightKg;
    map.set(key, cur);
  });
  return Array.from(map.values())
    .map((v) => ({
      ...v,
      totalCLP: Math.round(v.totalCLP),
      netWeightKg: Math.round(v.netWeightKg * 100) / 100,
    }))
    .sort((a, b) => b.totalCLP - a.totalCLP)
    .slice(0, topN);
}

export async function fetchSettlementRows(
  filters: EconomicFilters,
): Promise<SettlementReportRow[]> {
  const db = await getDb();
  const qb = db
    .getRepository(Transaction)
    .createQueryBuilder('tx')
    .leftJoinAndSelect('tx.producer', 'producer')
    .where('tx.type = :type', { type: TransactionType.SETTLEMENT })
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

  return rows.map((tx) => {
    const metadata = parseMetadata(tx.metadata);
    const status =
      metadata?.status === 'BORRADOR' ? ('BORRADOR' as const) : ('COMPLETA' as const);
    const receptionIds = Array.isArray(metadata?.receptionTransactionIds)
      ? metadata.receptionTransactionIds
      : [];
    return {
      id: String(tx.id),
      createdAt: tx.createdAt,
      seasonId: tx.seasonId ? String(tx.seasonId) : null,
      producerId: tx.producerId ? String(tx.producerId) : null,
      producerName: tx.producer?.name || 'Sin productor',
      status,
      paymentMethod: String(metadata?.paymentMethod || 'CASH'),
      receptionsTotalCLP: Math.round(toNumber(metadata?.receptionsTotalCLP, 0)),
      advancesAppliedCLP: Math.round(toNumber(metadata?.advancesAppliedCLP, 0)),
      netAmountCLP: Math.round(
        toNumber(metadata?.netAmountCLP, toNumber(tx.amount, 0)),
      ),
      receptionCount: receptionIds.length,
    };
  });
}

export function summarizeSettlements(rows: SettlementReportRow[]) {
  const settlementCount = rows.length;
  const completaCount = rows.filter((r) => r.status === 'COMPLETA').length;
  const borradorCount = settlementCount - completaCount;
  const receptionsTotalCLP = rows.reduce((s, r) => s + r.receptionsTotalCLP, 0);
  const advancesAppliedCLP = rows.reduce((s, r) => s + r.advancesAppliedCLP, 0);
  const netAmountCLP = rows.reduce((s, r) => s + r.netAmountCLP, 0);
  const producerCount = new Set(rows.map((r) => r.producerId || r.producerName)).size;
  return {
    settlementCount,
    completaCount,
    borradorCount,
    producerCount,
    receptionsTotalCLP: Math.round(receptionsTotalCLP),
    advancesAppliedCLP: Math.round(advancesAppliedCLP),
    netAmountCLP: Math.round(netAmountCLP),
  };
}

export function bucketSettlementsByDate(
  rows: SettlementReportRow[],
  grain: 'day' | 'week' | 'month',
) {
  const map = new Map<string, { count: number; netAmountCLP: number }>();
  rows.forEach((row) => {
    const key = bucketKey(new Date(row.createdAt), grain);
    const cur = map.get(key) ?? { count: 0, netAmountCLP: 0 };
    cur.count += 1;
    cur.netAmountCLP += row.netAmountCLP;
    map.set(key, cur);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([x, v]) => ({
      x,
      count: v.count,
      netAmountCLP: Math.round(v.netAmountCLP),
    }));
}

export function groupSettlementsByProducer(rows: SettlementReportRow[], topN = 20) {
  const map = new Map<
    string,
    {
      producerName: string;
      count: number;
      receptionsTotalCLP: number;
      advancesAppliedCLP: number;
      netAmountCLP: number;
    }
  >();
  rows.forEach((r) => {
    const key = r.producerId || r.producerName;
    const cur = map.get(key) ?? {
      producerName: r.producerName,
      count: 0,
      receptionsTotalCLP: 0,
      advancesAppliedCLP: 0,
      netAmountCLP: 0,
    };
    cur.count += 1;
    cur.receptionsTotalCLP += r.receptionsTotalCLP;
    cur.advancesAppliedCLP += r.advancesAppliedCLP;
    cur.netAmountCLP += r.netAmountCLP;
    map.set(key, cur);
  });
  return Array.from(map.values())
    .map((v) => ({
      ...v,
      receptionsTotalCLP: Math.round(v.receptionsTotalCLP),
      advancesAppliedCLP: Math.round(v.advancesAppliedCLP),
      netAmountCLP: Math.round(v.netAmountCLP),
    }))
    .sort((a, b) => b.netAmountCLP - a.netAmountCLP)
    .slice(0, topN);
}

export async function fetchAdvanceRows(
  filters: EconomicFilters,
): Promise<AdvanceReportRow[]> {
  const db = await getDb();
  const qb = db
    .getRepository(Transaction)
    .createQueryBuilder('tx')
    .leftJoinAndSelect('tx.producer', 'producer')
    .leftJoin(
      (sub) =>
        sub
          .select('rel.parentTransactionId', 'advanceId')
          .addSelect(
            "COALESCE(SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(rel.context, '$.amount')) AS DECIMAL(18,2))), 0)",
            'applied',
          )
          .from(TransactionRelation, 'rel')
          .where('rel.relationType = :advanceRelationType', {
            advanceRelationType: TransactionRelationType.ADVANCE_TO_SETTLEMENT,
          })
          .groupBy('rel.parentTransactionId'),
      'advanceApps',
      'advanceApps.advanceId = CAST(tx.id AS CHAR)',
    )
    .addSelect('COALESCE(advanceApps.applied, 0)', 'appliedAmount')
    .where('tx.type = :type', { type: TransactionType.ADVANCE })
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

  const { entities, raw } = await qb.getRawAndEntities();

  return entities.map((tx, i) => {
    const metadata = parseMetadata(tx.metadata);
    const amount = Math.round(toNumber(tx.amount, 0));
    const appliedAmount = Math.round(toNumber(raw[i]?.appliedAmount, 0));
    const availableAmount = Math.max(amount - appliedAmount, 0);
    const status: AdvanceReportRow['status'] =
      appliedAmount >= amount ? 'APPLIED' : 'ACTIVE';
    return {
      id: String(tx.id),
      createdAt: tx.createdAt,
      seasonId: tx.seasonId ? String(tx.seasonId) : null,
      producerId: tx.producerId ? String(tx.producerId) : null,
      producerName: tx.producer?.name || 'Sin productor',
      amount,
      appliedAmount,
      availableAmount,
      status,
      paymentMethod: String(metadata?.paymentMethod || 'CASH'),
    };
  });
}

export function summarizeAdvances(rows: AdvanceReportRow[]) {
  const advanceCount = rows.length;
  const activeCount = rows.filter((r) => r.status === 'ACTIVE').length;
  const appliedCount = rows.filter((r) => r.status === 'APPLIED').length;
  const amount = rows.reduce((s, r) => s + r.amount, 0);
  const appliedAmount = rows.reduce((s, r) => s + r.appliedAmount, 0);
  const availableAmount = rows.reduce((s, r) => s + r.availableAmount, 0);
  const producerCount = new Set(rows.map((r) => r.producerId || r.producerName)).size;
  return {
    advanceCount,
    activeCount,
    appliedCount,
    producerCount,
    amount: Math.round(amount),
    appliedAmount: Math.round(appliedAmount),
    availableAmount: Math.round(availableAmount),
  };
}

export function bucketAdvancesByDate(
  rows: AdvanceReportRow[],
  grain: 'day' | 'week' | 'month',
) {
  const map = new Map<string, { count: number; amount: number }>();
  rows.forEach((row) => {
    const key = bucketKey(new Date(row.createdAt), grain);
    const cur = map.get(key) ?? { count: 0, amount: 0 };
    cur.count += 1;
    cur.amount += row.amount;
    map.set(key, cur);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([x, v]) => ({
      x,
      count: v.count,
      amount: Math.round(v.amount),
    }));
}

export function groupAdvancesByProducer(rows: AdvanceReportRow[], topN = 20) {
  const map = new Map<
    string,
    {
      producerName: string;
      count: number;
      amount: number;
      appliedAmount: number;
      availableAmount: number;
    }
  >();
  rows.forEach((r) => {
    const key = r.producerId || r.producerName;
    const cur = map.get(key) ?? {
      producerName: r.producerName,
      count: 0,
      amount: 0,
      appliedAmount: 0,
      availableAmount: 0,
    };
    cur.count += 1;
    cur.amount += r.amount;
    cur.appliedAmount += r.appliedAmount;
    cur.availableAmount += r.availableAmount;
    map.set(key, cur);
  });
  return Array.from(map.values())
    .map((v) => ({
      ...v,
      amount: Math.round(v.amount),
      appliedAmount: Math.round(v.appliedAmount),
      availableAmount: Math.round(v.availableAmount),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, topN);
}
