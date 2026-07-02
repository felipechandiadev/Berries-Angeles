'use server';

import { getDb } from '../../data/db';
import { Transaction, TransactionType, TransactionDirection, AdvanceMetadata } from '../../data/entities/Transaction';
import { TransactionRelation, TransactionRelationType } from '../../data/entities/TransactionRelation';
import { ReceptionPack } from '../../data/entities/ReceptionPack';

export interface ListPendingReceptionsInput {
  producerId?: string;
  seasonId?: string;
  page?: number;
  limit?: number;
}

export interface PendingReceptionRow {
  transactionId: string;
  createdAt: string;
  guideNumber: string | null;
  seasonName: string | null;
  producerName: string | null;
  productiveUnitName: string | null;
  varieties: string[];
  packCount: number;
  netWeightKg: number;
  totalCLPToPay: number;
  usdAmount: number;
  exchangeRate: number;
}

export interface PendingReceptionsResult {
  rows: PendingReceptionRow[];
  total: number;
  page: number;
  limit: number;
}

export interface ListPendingAdvancesInput {
  producerId?: string;
  page?: number;
  limit?: number;
}

export interface PendingAdvanceRow {
  transactionId: string;
  createdAt: string;
  seasonName: string | null;
  operatorName: string | null;
  paymentMethod: string;
  paymentReference: string | null;
  notes: string | null;
  amount: number;
  appliedAmount: number;
  availableAmount: number;
}

export interface PendingAdvancesResult {
  rows: PendingAdvanceRow[];
  total: number;
  page: number;
  limit: number;
  totals: {
    amount: number;
    appliedAmount: number;
    availableAmount: number;
  };
}

const MAX_LIMIT = 100;

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return fallback;
};

const parseMetadata = (value: unknown): Record<string, any> | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('[listPendingReceptions] No se pudo parsear metadata:', error);
      return null;
    }
  }
  if (typeof value === 'object') {
    return value as Record<string, any>;
  }
  return null;
};

export async function listPendingReceptions(
  input: ListPendingReceptionsInput,
): Promise<PendingReceptionsResult> {
  const producerId = input.producerId?.trim();
  const page = Number.isFinite(input.page) ? Math.max(1, Math.floor(input.page as number)) : 1;
  const limitCandidate = Number.isFinite(input.limit) ? Math.max(1, Math.floor(input.limit as number)) : 25;
  const limit = Math.min(limitCandidate, MAX_LIMIT);

  if (!producerId) {
    return {
      rows: [],
      total: 0,
      page,
      limit,
    };
  }

  const db = await getDb();
  const receptionRepo = db.getRepository(Transaction);

  const qb = receptionRepo
    .createQueryBuilder('reception')
    .leftJoinAndSelect('reception.producer', 'producer')
    .leftJoinAndSelect('producer.productiveUnit', 'unit')
    .leftJoinAndSelect('reception.season', 'season')
    .leftJoin(
      TransactionRelation,
      'settlementRelation',
      'settlementRelation.parentTransactionId = reception.id AND settlementRelation.relationType = :relationType',
      { relationType: TransactionRelationType.RECEPTION_TO_SETTLEMENT },
    )
    .where('reception.type = :receptionType', { receptionType: TransactionType.RECEPTION })
    .andWhere('reception.deletedAt IS NULL')
    .andWhere('reception.producerId = :producerId', { producerId })
    .andWhere('settlementRelation.id IS NULL')
    .orderBy('reception.createdAt', 'DESC');

  if (input.seasonId?.trim()) {
    qb.andWhere('reception.seasonId = :seasonId', { seasonId: input.seasonId.trim() });
  }

  qb.skip((page - 1) * limit).take(limit);

  const [receptions, total] = await qb.getManyAndCount();

  const receptionIds = receptions.map((reception) => String(reception.id));
  const packStats = new Map<string, { packCount: number; netWeightKg: number }>();
  const varietiesMap = new Map<string, string[]>();

  if (receptionIds.length > 0) {
    const rawStats = await db
      .getRepository(ReceptionPack)
      .createQueryBuilder('pack')
      .select('pack.receptionTransactionId', 'receptionId')
      .addSelect('COUNT(pack.id)', 'packCount')
      .addSelect('COALESCE(SUM(pack.netWeight), 0)', 'netWeightKg')
      .where('pack.receptionTransactionId IN (:...ids)', { ids: receptionIds })
      .groupBy('pack.receptionTransactionId')
      .getRawMany<{ receptionId: string; packCount: string; netWeightKg: string }>();

    rawStats.forEach((row) => {
      packStats.set(row.receptionId, {
        packCount: Number(row.packCount ?? 0),
        netWeightKg: Number(row.netWeightKg ?? 0),
      });
    });

    const rawVarieties = await db
      .getRepository(ReceptionPack)
      .createQueryBuilder('pack')
      .select('pack.receptionTransactionId', 'receptionId')
      .addSelect('pack.varietyName', 'varietyName')
      .where('pack.receptionTransactionId IN (:...ids)', { ids: receptionIds })
      .distinct(true)
      .getRawMany<{ receptionId: string; varietyName: string }>();

    rawVarieties.forEach((row) => {
      const existing = varietiesMap.get(row.receptionId) || [];
      existing.push(row.varietyName);
      varietiesMap.set(row.receptionId, existing);
    });
  }

  const rows: PendingReceptionRow[] = receptions.map((reception) => {
    const transactionId = String(reception.id);
    const metadata = parseMetadata(reception.metadata);
    const totals = metadata?.totals ?? {};
    const packsFromMetadata = Array.isArray(metadata?.packs) ? metadata.packs : [];

    const packCountFromTotals = toNumber(totals?.packsCount, Number.NaN);
    const netWeightFromTotals = toNumber(totals?.netWeightKg, Number.NaN);
    const totalCLPFromTotals = toNumber(totals?.totalCLPToPay, Number.NaN);

    const stats = packStats.get(transactionId);

    const packCount = Number.isFinite(packCountFromTotals)
      ? packCountFromTotals
      : packsFromMetadata.length || stats?.packCount || 0;

    const netWeightKg = Number.isFinite(netWeightFromTotals)
      ? netWeightFromTotals
      : stats?.netWeightKg || 0;

    const totalCLPToPay = Number.isFinite(totalCLPFromTotals)
      ? totalCLPFromTotals
      : toNumber(reception.amount, 0);

    const usdAmount = toNumber(totals?.usdAmount, 0);
    const exchangeRate = toNumber(totals?.exchangeRate, 0);

    const guideNumberRaw = metadata?.guideNumber ?? null;

    return {
      transactionId,
      createdAt: reception.createdAt?.toISOString?.() ?? new Date().toISOString(),
      guideNumber: guideNumberRaw ? String(guideNumberRaw) : null,
      seasonName: reception.season?.name ?? null,
      producerName: reception.producer?.name ?? null,
      productiveUnitName: reception.producer?.productiveUnit?.name ?? null,
      varieties: varietiesMap.get(transactionId) || [],
      packCount: Number(packCount),
      netWeightKg: Number(netWeightKg),
      totalCLPToPay: Number(totalCLPToPay),
      usdAmount,
      exchangeRate,
    };
  });

  return {
    rows,
    total,
    page,
    limit,
  };
}

const parseAdvanceRelationAmount = (context: string | null | undefined): number => {
  if (!context) {
    return 0;
  }

  try {
    const parsed = JSON.parse(context) as { amount?: unknown };
    const amount = parsed?.amount;
    return typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  } catch (error) {
    console.warn('[listPendingAdvances] Invalid relation context JSON', error);
    return 0;
  }
};

export async function listPendingAdvances(
  input: ListPendingAdvancesInput,
): Promise<PendingAdvancesResult> {
  const producerId = input.producerId?.trim();
  const page = Number.isFinite(input.page) ? Math.max(1, Math.floor(input.page as number)) : 1;
  const limitCandidate = Number.isFinite(input.limit) ? Math.max(1, Math.floor(input.limit as number)) : 25;
  const limit = Math.min(limitCandidate, MAX_LIMIT);

  if (!producerId) {
    return {
      rows: [],
      total: 0,
      page,
      limit,
      totals: {
        amount: 0,
        appliedAmount: 0,
        availableAmount: 0,
      },
    };
  }

  const db = await getDb();
  const advanceRepo = db.getRepository(Transaction);

  const advances = await advanceRepo
    .createQueryBuilder('advance')
    .leftJoinAndSelect('advance.season', 'season')
    .leftJoinAndSelect('advance.user', 'operator')
    .where('advance.type = :type', { type: TransactionType.ADVANCE })
    .andWhere('advance.direction = :direction', { direction: TransactionDirection.OUT })
    .andWhere('advance.deletedAt IS NULL')
    .andWhere('advance.producerId = :producerId', { producerId })
    .orderBy('advance.createdAt', 'DESC')
    .getMany();

  const advanceIds = advances.map((advance) => String(advance.id));
  const appliedAmounts = new Map<string, number>();

  if (advanceIds.length > 0) {
    const rawRelations = await db
      .getRepository(TransactionRelation)
      .createQueryBuilder('relation')
      .select('relation.parentTransactionId', 'advanceId')
      .addSelect('relation.context', 'context')
      .where('relation.relationType = :relationType', { relationType: TransactionRelationType.ADVANCE_TO_SETTLEMENT })
      .andWhere('relation.parentTransactionId IN (:...ids)', { ids: advanceIds })
      .getRawMany<{ advanceId: string; context: string | null }>();

    rawRelations.forEach((row) => {
      const amount = parseAdvanceRelationAmount(row.context);
      if (amount > 0) {
        appliedAmounts.set(row.advanceId, (appliedAmounts.get(row.advanceId) ?? 0) + amount);
      }
    });
  }

  const advanceRows = advances.map<PendingAdvanceRow>((advance) => {
    const transactionId = String(advance.id);
    const metadata = parseMetadata(advance.metadata) as AdvanceMetadata | null;
    const paymentMethod = typeof metadata?.paymentMethod === 'string' ? metadata.paymentMethod : 'CASH';
    const paymentDetails = metadata?.paymentDetails ?? {};
    const paymentReference =
      typeof paymentDetails.transactionId === 'string'
        ? paymentDetails.transactionId
        : typeof paymentDetails.checkNumber === 'string'
          ? paymentDetails.checkNumber
          : null;
    const notes = typeof metadata?.notes === 'string' && metadata.notes.trim() ? metadata.notes.trim() : null;

    const amount = Number(advance.amount ?? 0);
    const appliedAmount = appliedAmounts.get(transactionId) ?? 0;
    const availableAmount = advance.deletedAt ? 0 : Math.max(amount - appliedAmount, 0);

    return {
      transactionId,
      createdAt: advance.createdAt?.toISOString?.() ?? new Date().toISOString(),
      seasonName: advance.season?.name ?? null,
      operatorName: advance.user?.userName ?? null,
      paymentMethod,
      paymentReference,
      notes,
      amount,
      appliedAmount,
      availableAmount,
    };
  });

  const pendingRows = advanceRows.filter((row) => row.availableAmount > 0);

  const totals = pendingRows.reduce(
    (acc, row) => {
      acc.amount += row.amount;
      acc.appliedAmount += row.appliedAmount;
      acc.availableAmount += row.availableAmount;
      return acc;
    },
    { amount: 0, appliedAmount: 0, availableAmount: 0 },
  );

  const total = pendingRows.length;
  const start = (page - 1) * limit;
  const pagedRows = pendingRows.slice(start, start + limit);

  return {
    rows: pagedRows,
    total,
    page,
    limit,
    totals,
  };
}
