import { getDb } from '@/data/db';
import {
  Transaction,
  TransactionDirection,
  TransactionType,
} from '@/data/entities/Transaction';
import { Tray } from '@/data/entities/Tray';
import { bucketKey } from '../dates';

const TRAY_MOVEMENT_TYPES = [
  TransactionType.TRAY_ADJUSTMENT,
  TransactionType.TRAY_IN_FROM_PRODUCER,
  TransactionType.TRAY_OUT_TO_PRODUCER,
  TransactionType.TRAY_OUT_TO_CLIENT,
  TransactionType.TRAY_IN_FROM_CLIENT,
  TransactionType.TRAY_RECEPTION_FROM_PRODUCER,
  TransactionType.TRAY_RECEPTION_FROM_CLIENT,
  TransactionType.TRAY_DELIVERY_TO_PRODUCER,
  TransactionType.TRAY_DELIVERY_TO_CLIENT,
] as const;

const TRAY_TYPE_LABELS: Record<string, string> = {
  [TransactionType.TRAY_ADJUSTMENT]: 'Ajuste',
  [TransactionType.TRAY_IN_FROM_PRODUCER]: 'Entrada productor',
  [TransactionType.TRAY_OUT_TO_PRODUCER]: 'Salida productor',
  [TransactionType.TRAY_OUT_TO_CLIENT]: 'Salida cliente',
  [TransactionType.TRAY_IN_FROM_CLIENT]: 'Entrada cliente',
  [TransactionType.TRAY_RECEPTION_FROM_PRODUCER]: 'Recepción productor',
  [TransactionType.TRAY_RECEPTION_FROM_CLIENT]: 'Recepción cliente',
  [TransactionType.TRAY_DELIVERY_TO_PRODUCER]: 'Entrega productor',
  [TransactionType.TRAY_DELIVERY_TO_CLIENT]: 'Entrega cliente',
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

export type TrayFilters = {
  dateFrom: string;
  dateTo: string;
};

export type TrayMovementReportRow = {
  id: string;
  createdAt: Date;
  type: string;
  typeLabel: string;
  direction: 'IN' | 'OUT';
  amount: number;
  trayName: string;
  counterpartyName: string;
};

export async function fetchTrayMovementRows(
  filters: TrayFilters,
): Promise<TrayMovementReportRow[]> {
  const db = await getDb();
  const qb = db
    .getRepository(Transaction)
    .createQueryBuilder('tx')
    .leftJoinAndSelect('tx.producer', 'producer')
    .leftJoinAndSelect('tx.client', 'client')
    .leftJoinAndSelect('client.person', 'clientPerson')
    .leftJoin(
      Tray,
      'tray',
      "tray.id = JSON_UNQUOTE(JSON_EXTRACT(tx.metadata, '$.trayId'))",
    )
    .addSelect('tray.name', 'trayName')
    .where('tx.deletedAt IS NULL')
    .andWhere('tx.type IN (:...trayTypes)', { trayTypes: [...TRAY_MOVEMENT_TYPES] })
    .andWhere('DATE(tx.createdAt) >= :dateFrom', { dateFrom: filters.dateFrom })
    .andWhere('DATE(tx.createdAt) <= :dateTo', { dateTo: filters.dateTo })
    .orderBy('tx.createdAt', 'DESC');

  const { entities, raw } = await qb.getRawAndEntities();

  return entities.map((tx, i) => {
    const metadata = parseMetadata(tx.metadata);
    let counterpartyName = '—';
    if (typeof metadata?.counterpartyName === 'string' && metadata.counterpartyName.trim()) {
      counterpartyName = metadata.counterpartyName;
    } else if (tx.producer?.name) {
      counterpartyName = tx.producer.name;
    } else if (tx.client?.person?.name) {
      counterpartyName = tx.client.person.name;
    }

    return {
      id: String(tx.id),
      createdAt: tx.createdAt,
      type: tx.type,
      typeLabel: TRAY_TYPE_LABELS[tx.type] || tx.type,
      direction: tx.direction === TransactionDirection.IN ? 'IN' : 'OUT',
      amount: toNumber(tx.amount, 0),
      trayName: raw[i]?.trayName || metadata?.trayName || '—',
      counterpartyName,
    };
  });
}

export function summarizeTrayMovements(rows: TrayMovementReportRow[]) {
  const movementCount = rows.length;
  const inCount = rows.filter((r) => r.direction === 'IN').length;
  const outCount = movementCount - inCount;
  const traysIn = rows
    .filter((r) => r.direction === 'IN')
    .reduce((s, r) => s + r.amount, 0);
  const traysOut = rows
    .filter((r) => r.direction === 'OUT')
    .reduce((s, r) => s + r.amount, 0);
  return {
    movementCount,
    inCount,
    outCount,
    traysIn: Math.round(traysIn),
    traysOut: Math.round(traysOut),
    netTrays: Math.round(traysIn - traysOut),
  };
}

export function bucketTrayMovementsByDate(
  rows: TrayMovementReportRow[],
  grain: 'day' | 'week' | 'month',
) {
  const map = new Map<string, { inQty: number; outQty: number }>();
  rows.forEach((row) => {
    const key = bucketKey(new Date(row.createdAt), grain);
    const cur = map.get(key) ?? { inQty: 0, outQty: 0 };
    if (row.direction === 'IN') cur.inQty += row.amount;
    else cur.outQty += row.amount;
    map.set(key, cur);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([x, v]) => ({
      x,
      inQty: Math.round(v.inQty),
      outQty: Math.round(v.outQty),
    }));
}

export function groupTrayMovementsByType(rows: TrayMovementReportRow[]) {
  const map = new Map<string, { typeLabel: string; count: number; amount: number }>();
  rows.forEach((r) => {
    const cur = map.get(r.type) ?? { typeLabel: r.typeLabel, count: 0, amount: 0 };
    cur.count += 1;
    cur.amount += r.amount;
    map.set(r.type, cur);
  });
  return Array.from(map.values())
    .map((v) => ({ ...v, amount: Math.round(v.amount) }))
    .sort((a, b) => b.amount - a.amount);
}

export function groupTrayMovementsByCounterparty(
  rows: TrayMovementReportRow[],
  topN = 20,
) {
  const map = new Map<
    string,
    { counterpartyName: string; inQty: number; outQty: number }
  >();
  rows.forEach((r) => {
    const key = r.counterpartyName || '—';
    const cur = map.get(key) ?? { counterpartyName: key, inQty: 0, outQty: 0 };
    if (r.direction === 'IN') cur.inQty += r.amount;
    else cur.outQty += r.amount;
    map.set(key, cur);
  });
  return Array.from(map.values())
    .map((v) => ({
      ...v,
      inQty: Math.round(v.inQty),
      outQty: Math.round(v.outQty),
      netQty: Math.round(v.inQty - v.outQty),
    }))
    .sort((a, b) => Math.abs(b.netQty) - Math.abs(a.netQty))
    .slice(0, topN);
}
