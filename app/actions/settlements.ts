'use server';

import { revalidatePath } from 'next/cache';
import { In, IsNull } from 'typeorm';
import { getDb } from '../../data/db';
import {
  Transaction,
  TransactionType,
  TransactionDirection,
  TransactionUnit,
  AdvanceMetadata,
  SettlementMetadata,
  SettlementStatus,
} from '../../data/entities/Transaction';
import { TransactionRelation, TransactionRelationType } from '../../data/entities/TransactionRelation';
import { ReceptionPack } from '../../data/entities/ReceptionPack';
import { Producer } from '../../data/entities/Producer';
import { User } from '../../data/entities/User';
import { Season } from '../../data/entities/Season';
import { AdminBankAccount } from '../../data/entities/AdminBankAccount';
import { getAppConfigSettings } from './appConfigSettings';
import {
  buildOutboundPaymentDetails,
  type PaymentDetails,
  type PaymentMethod,
} from '@/lib/paymentDetails';
import {
  normalizeSqlExpr,
  normalizeString,
  parseColumnFilters,
  resolveLimit,
  resolvePage,
  resolveSortField,
  resolveSortOrder,
} from '@/lib/gridQuery';
import { Brackets, SelectQueryBuilder } from 'typeorm';

export interface ListPendingReceptionsInput {
  producerId?: string;
  seasonId?: string;
  /** When editing a draft, include receptions already linked to this settlement */
  editingSettlementId?: string;
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
  /** When editing a draft, ignore applications belonging to this settlement */
  editingSettlementId?: string;
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

  const editingSettlementId = input.editingSettlementId?.trim() || undefined;

  const qb = receptionRepo
    .createQueryBuilder('reception')
    .leftJoinAndSelect('reception.producer', 'producer')
    .leftJoinAndSelect('producer.productiveUnit', 'unit')
    .leftJoinAndSelect('reception.season', 'season')
    .leftJoin(
      TransactionRelation,
      'settlementRelation',
      editingSettlementId
        ? `settlementRelation.parentTransactionId = reception.id
           AND settlementRelation.relationType = :relationType
           AND settlementRelation.childTransactionId <> :editingSettlementId`
        : 'settlementRelation.parentTransactionId = reception.id AND settlementRelation.relationType = :relationType',
      editingSettlementId
        ? {
            relationType: TransactionRelationType.RECEPTION_TO_SETTLEMENT,
            editingSettlementId,
          }
        : { relationType: TransactionRelationType.RECEPTION_TO_SETTLEMENT },
    )
    .where('reception.type = :receptionType', { receptionType: TransactionType.RECEPTION })
    .andWhere('reception.deletedAt IS NULL')
    .andWhere('reception.producerId = :producerId', { producerId })
    .andWhere('settlementRelation.id IS NULL')
    .andWhere(
      `COALESCE(JSON_UNQUOTE(JSON_EXTRACT(reception.metadata, '$.paymentStatus')), 'PENDING') <> :paidOnReception`,
      { paidOnReception: 'PAID_ON_RECEPTION' },
    )
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

  const editingSettlementId = input.editingSettlementId?.trim() || undefined;

  if (advanceIds.length > 0) {
    const relQb = db
      .getRepository(TransactionRelation)
      .createQueryBuilder('relation')
      .select('relation.parentTransactionId', 'advanceId')
      .addSelect('relation.context', 'context')
      .where('relation.relationType = :relationType', {
        relationType: TransactionRelationType.ADVANCE_TO_SETTLEMENT,
      })
      .andWhere('relation.parentTransactionId IN (:...ids)', { ids: advanceIds });

    if (editingSettlementId) {
      relQb.andWhere('relation.childTransactionId <> :editingSettlementId', {
        editingSettlementId,
      });
    }

    const rawRelations = await relQb.getRawMany<{ advanceId: string; context: string | null }>();

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

export type { SettlementStatus };

export interface SaveSettlementInput {
  producerId: string;
  userId: string;
  status: SettlementStatus;
  receptionTransactionIds: string[];
  advanceApplications: Array<{ transactionId: string; amount: number }>;
  notes?: string;
  seasonId?: string;
  settlementId?: string;
  paymentMethod?: PaymentMethod;
  paymentDetails?: PaymentDetails;
}

export interface SaveSettlementResult {
  success: boolean;
  settlementId?: string;
  error?: string;
}

export interface DeleteSettlementInput {
  settlementId: string;
  userId: string;
}

export interface DeleteSettlementResult {
  success: boolean;
  error?: string;
}

export interface SettlementWizardData {
  settlementId: string;
  producerId: string;
  status: SettlementStatus;
  receptionTransactionIds: string[];
  advanceApplications: Array<{ transactionId: string; amount: number }>;
  receptionsTotalCLP: number;
  advancesAppliedCLP: number;
  netAmountCLP: number;
  notes?: string;
  paymentMethod?: PaymentMethod;
  paymentDetails?: PaymentDetails;
}

export interface ListSettlementsFilters {
  producerId?: string;
  seasonId?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
  filtration?: boolean;
  filters?: string;
  sortField?: string;
  sort?: string;
}

const SETTLEMENT_JSON_STATUS = "JSON_UNQUOTE(JSON_EXTRACT(settlement.metadata, '$.status'))";
const SETTLEMENT_JSON_PAYMENT = "JSON_UNQUOTE(JSON_EXTRACT(settlement.metadata, '$.paymentMethod'))";
const SETTLEMENT_JSON_NET = "JSON_EXTRACT(settlement.metadata, '$.netAmountCLP')";
const SETTLEMENT_STATUS_LABEL = `CASE WHEN ${SETTLEMENT_JSON_STATUS} = 'BORRADOR' THEN 'borrador' ELSE 'completa' END`;
const SETTLEMENT_PAYMENT_LABEL = `CASE ${SETTLEMENT_JSON_PAYMENT} WHEN 'CASH' THEN 'efectivo' WHEN 'TRANSFER' THEN 'transferencia' WHEN 'CHECK' THEN 'cheque' ELSE '' END`;

const SETTLEMENT_SORT_FIELDS = [
  'createdAt',
  'id',
  'transactionId',
  'producerName',
  'seasonName',
  'amount',
  'netAmountCLP',
] as const;

const SETTLEMENT_FILTER_COLUMNS = [
  'transactionId',
  'id',
  'producerName',
  'seasonName',
  'status',
  'operatorName',
  'createdAt',
  'paymentMethod',
  'netAmountCLP',
] as const;

function shouldApplySettlementColumnFilters(filters: ListSettlementsFilters): boolean {
  return filters.filtration === true || Boolean(filters.filters?.trim());
}

function resolveSettlementSortColumn(sortField: string): string {
  switch (sortField) {
    case 'id':
    case 'transactionId':
      return 'settlement.id';
    case 'producerName':
      return 'producer.name';
    case 'seasonName':
      return 'season.name';
    case 'netAmountCLP':
    case 'amount':
      return `COALESCE(${SETTLEMENT_JSON_NET}, settlement.amount)`;
    case 'createdAt':
    default:
      return 'settlement.createdAt';
  }
}

function applySettlementsGridFilters(
  qb: SelectQueryBuilder<Transaction>,
  filters: ListSettlementsFilters,
): void {
  if (filters.search?.trim()) {
    const term = normalizeString(filters.search.trim());
    const like = `%${term}%`;
    const searchColumns = [
      'producer.name',
      'CAST(settlement.id AS CHAR)',
      'season.name',
      'operator.userName',
      'operatorPerson.name',
      'CAST(settlement.amount AS CHAR)',
      `CAST(COALESCE(${SETTLEMENT_JSON_NET}, settlement.amount) AS CHAR)`,
      "DATE_FORMAT(settlement.createdAt, '%d-%m-%Y')",
      "DATE_FORMAT(settlement.createdAt, '%Y-%m-%d')",
      SETTLEMENT_JSON_PAYMENT,
      SETTLEMENT_PAYMENT_LABEL,
      SETTLEMENT_STATUS_LABEL,
    ];

    qb.andWhere(
      new Brackets((sub) => {
        searchColumns.forEach((column, index) => {
          const expr = normalizeSqlExpr(column);
          const clause = `${expr} LIKE :settlementSearch`;
          if (index === 0) {
            sub.where(clause, { settlementSearch: like });
          } else {
            sub.orWhere(clause, { settlementSearch: like });
          }
        });
        if (term.includes('borrador')) {
          sub.orWhere(`${SETTLEMENT_JSON_STATUS} = :settlementStatusBorrador`, {
            settlementStatusBorrador: 'BORRADOR',
          });
        }
        if (term.includes('completa')) {
          sub
            .orWhere(`${SETTLEMENT_JSON_STATUS} IS NULL`)
            .orWhere(`${SETTLEMENT_JSON_STATUS} <> :settlementStatusNotBorrador`, {
              settlementStatusNotBorrador: 'BORRADOR',
            });
        }
      }),
    );
  }

  if (shouldApplySettlementColumnFilters(filters) && filters.filters) {
    const columnFilters = parseColumnFilters(filters.filters, SETTLEMENT_FILTER_COLUMNS);
    columnFilters.forEach((filter, index) => {
      const paramName = `settlementColFilter${index}`;
      const normalized = normalizeString(filter.value);

      switch (filter.column) {
        case 'transactionId':
        case 'id':
          qb.andWhere(`CAST(settlement.id AS CHAR) LIKE :${paramName}`, {
            [paramName]: `%${filter.value.trim()}%`,
          });
          break;
        case 'producerName':
          qb.andWhere(`${normalizeSqlExpr('producer.name')} LIKE :${paramName}`, {
            [paramName]: `%${normalized}%`,
          });
          break;
        case 'seasonName':
          qb.andWhere(`${normalizeSqlExpr('season.name')} LIKE :${paramName}`, {
            [paramName]: `%${normalized}%`,
          });
          break;
        case 'status': {
          const wantsDraft =
            normalized.includes('borrador') || normalized === 'borrador';
          const wantsComplete =
            normalized.includes('completa') || normalized === 'completa';
          if (wantsDraft && !wantsComplete) {
            qb.andWhere(`${SETTLEMENT_JSON_STATUS} = :${paramName}`, {
              [paramName]: 'BORRADOR',
            });
          } else if (wantsComplete && !wantsDraft) {
            qb.andWhere(
              new Brackets((sub) => {
                sub
                  .where(`${SETTLEMENT_JSON_STATUS} IS NULL`)
                  .orWhere(`${SETTLEMENT_JSON_STATUS} <> :${paramName}`, {
                    [paramName]: 'BORRADOR',
                  });
              }),
            );
          } else {
            qb.andWhere(`${normalizeSqlExpr(SETTLEMENT_STATUS_LABEL)} LIKE :${paramName}`, {
              [paramName]: `%${normalized}%`,
            });
          }
          break;
        }
        case 'operatorName':
          qb.andWhere(
            new Brackets((sub) => {
              sub
                .where(`${normalizeSqlExpr('operator.userName')} LIKE :${paramName}`, {
                  [paramName]: `%${normalized}%`,
                })
                .orWhere(`${normalizeSqlExpr('operatorPerson.name')} LIKE :${paramName}`, {
                  [paramName]: `%${normalized}%`,
                });
            }),
          );
          break;
        case 'createdAt':
          qb.andWhere('DATE(settlement.createdAt) = :settlementColDate', {
            settlementColDate: filter.value,
          });
          break;
        case 'paymentMethod':
          qb.andWhere(
            new Brackets((sub) => {
              sub
                .where(`${normalizeSqlExpr(SETTLEMENT_JSON_PAYMENT)} LIKE :${paramName}`, {
                  [paramName]: `%${normalized}%`,
                })
                .orWhere(`${normalizeSqlExpr(SETTLEMENT_PAYMENT_LABEL)} LIKE :${paramName}`, {
                  [paramName]: `%${normalized}%`,
                });
            }),
          );
          break;
        case 'netAmountCLP':
          qb.andWhere(
            `CAST(COALESCE(${SETTLEMENT_JSON_NET}, settlement.amount) AS CHAR) LIKE :${paramName}`,
            { [paramName]: `%${filter.value.trim()}%` },
          );
          break;
        default:
          break;
      }
    });
  }
}

export interface SettlementSummary {
  id: string;
  transactionId: string;
  createdAt: string;
  producerId?: string;
  producerName?: string;
  seasonId?: string;
  seasonName?: string;
  operatorId?: string;
  operatorName?: string;
  status: SettlementStatus;
  receptionsCount: number;
  receptionsTotalCLP: number;
  advancesCount: number;
  advancesAppliedCLP: number;
  netAmountCLP: number;
  notes?: string;
  paymentMethod?: PaymentMethod | null;
}

export interface ListSettlementsResult {
  rows: SettlementSummary[];
  total: number;
  page: number;
  limit: number;
}

const normalizeSettlementStatus = (value: unknown): SettlementStatus => {
  return value === 'BORRADOR' ? 'BORRADOR' : 'COMPLETA';
};

const receptionClpAmount = (reception: Transaction): number => {
  const metadata = parseMetadata(reception.metadata);
  const totals = metadata?.totals ?? {};
  const fromTotals = toNumber(totals?.totalCLPToPay, Number.NaN);
  if (Number.isFinite(fromTotals)) return fromTotals;
  return toNumber(reception.amount, 0);
};

export async function saveSettlement(
  input: SaveSettlementInput,
): Promise<SaveSettlementResult> {
  const producerId = input.producerId?.trim();
  const userId = input.userId?.trim();
  const status: SettlementStatus = input.status === 'BORRADOR' ? 'BORRADOR' : 'COMPLETA';
  const existingSettlementId = input.settlementId?.trim() || undefined;
  const receptionIds = [...new Set((input.receptionTransactionIds ?? []).map(String).filter(Boolean))];
  const advanceApplications = (input.advanceApplications ?? [])
    .map((app) => ({
      transactionId: String(app.transactionId),
      amount: Math.round(toNumber(app.amount, 0)),
    }))
    .filter((app) => app.transactionId && app.amount > 0);

  if (!producerId) {
    return { success: false, error: 'Debe seleccionar un productor.' };
  }
  if (!userId) {
    return { success: false, error: 'Usuario no autenticado.' };
  }
  if (receptionIds.length === 0 && advanceApplications.length === 0) {
    return { success: false, error: 'Debe seleccionar al menos una recepción o un anticipo.' };
  }

  try {
    const db = await getDb();
    const [producer, user] = await Promise.all([
      db.getRepository(Producer).findOne({ where: { id: producerId } }),
      db.getRepository(User).findOne({ where: { id: userId } }),
    ]);

    if (!producer) {
      return { success: false, error: 'Productor no encontrado.' };
    }
    if (!user) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    let seasonId = input.seasonId?.trim();
    if (!seasonId) {
      const activeSeason = await db.getRepository(Season).findOne({
        where: { active: true, deletedAt: IsNull() },
        withDeleted: false,
      });
      seasonId = activeSeason?.id;
    }

    const settlementId = await db.transaction(async (manager) => {
      const txRepo = manager.getRepository(Transaction);
      const relRepo = manager.getRepository(TransactionRelation);

      let settlement: Transaction | null = null;
      if (existingSettlementId) {
        settlement = await txRepo.findOne({
          where: {
            id: BigInt(existingSettlementId),
            type: TransactionType.SETTLEMENT,
            deletedAt: IsNull(),
          } as any,
        });
        if (!settlement) {
          throw new Error('Liquidación no encontrada.');
        }
        const currentStatus = normalizeSettlementStatus(
          (parseMetadata(settlement.metadata) as SettlementMetadata | null)?.status,
        );
        if (currentStatus === 'COMPLETA') {
          throw new Error('Una liquidación completa no se puede editar.');
        }
        if (settlement.producerId && settlement.producerId !== producerId) {
          throw new Error('El productor de la liquidación no coincide.');
        }
      }

      const receptions =
        receptionIds.length > 0
          ? await txRepo.find({
              where: {
                id: In(receptionIds.map((id) => BigInt(id))),
                type: TransactionType.RECEPTION,
                producerId,
                deletedAt: IsNull(),
              } as any,
            })
          : [];

      if (receptions.length !== receptionIds.length) {
        throw new Error('Una o más recepciones no son válidas para este productor.');
      }

      if (receptionIds.length > 0) {
        const linksQb = relRepo
          .createQueryBuilder('relation')
          .where('relation.relationType = :type', {
            type: TransactionRelationType.RECEPTION_TO_SETTLEMENT,
          })
          .andWhere('relation.parentTransactionId IN (:...ids)', { ids: receptionIds });
        if (existingSettlementId) {
          linksQb.andWhere('relation.childTransactionId <> :settlementId', {
            settlementId: existingSettlementId,
          });
        }
        const existingLinks = await linksQb.getCount();
        if (existingLinks > 0) {
          throw new Error('Una o más recepciones ya están asociadas a otra liquidación.');
        }
      }

      if (!seasonId && receptions[0]?.seasonId) {
        seasonId = receptions[0].seasonId;
      }
      if (!seasonId && settlement?.seasonId) {
        seasonId = settlement.seasonId;
      }
      if (!seasonId) {
        throw new Error('No hay una temporada configurada para la liquidación.');
      }

      const advanceIds = advanceApplications.map((a) => a.transactionId);
      const advances =
        advanceIds.length > 0
          ? await txRepo.find({
              where: {
                id: In(advanceIds.map((id) => BigInt(id))),
                type: TransactionType.ADVANCE,
                producerId,
                deletedAt: IsNull(),
              } as any,
            })
          : [];

      if (advances.length !== advanceIds.length) {
        throw new Error('Uno o más anticipos no son válidos para este productor.');
      }

      const appliedByAdvance = new Map<string, number>();
      if (advanceIds.length > 0) {
        const rawQb = relRepo
          .createQueryBuilder('relation')
          .select('relation.parentTransactionId', 'advanceId')
          .addSelect('relation.context', 'context')
          .where('relation.relationType = :relationType', {
            relationType: TransactionRelationType.ADVANCE_TO_SETTLEMENT,
          })
          .andWhere('relation.parentTransactionId IN (:...ids)', { ids: advanceIds });
        if (existingSettlementId) {
          rawQb.andWhere('relation.childTransactionId <> :settlementId', {
            settlementId: existingSettlementId,
          });
        }
        const rawRelations = await rawQb.getRawMany<{ advanceId: string; context: string | null }>();

        rawRelations.forEach((row) => {
          const amount = parseAdvanceRelationAmount(row.context);
          if (amount > 0) {
            appliedByAdvance.set(row.advanceId, (appliedByAdvance.get(row.advanceId) ?? 0) + amount);
          }
        });
      }

      for (const app of advanceApplications) {
        const advance = advances.find((a) => String(a.id) === app.transactionId);
        if (!advance) {
          throw new Error('Anticipo no encontrado.');
        }
        const alreadyApplied = appliedByAdvance.get(app.transactionId) ?? 0;
        const available = Math.max(toNumber(advance.amount, 0) - alreadyApplied, 0);
        if (app.amount > available) {
          throw new Error('El monto aplicado supera el saldo disponible de un anticipo.');
        }
      }

      const receptionsTotalCLP = receptions.reduce((sum, r) => sum + receptionClpAmount(r), 0);
      const advancesAppliedCLP = advanceApplications.reduce((sum, a) => sum + a.amount, 0);
      if (receptionIds.length > 0 && advancesAppliedCLP > receptionsTotalCLP) {
        throw new Error('Los anticipos no pueden superar el total de las recepciones.');
      }
      const netAmountCLP = Math.max(0, receptionsTotalCLP - advancesAppliedCLP);

      let paymentMethod: PaymentMethod | undefined;
      let paymentDetails: PaymentDetails | undefined;

      if (netAmountCLP > 0) {
        const method = input.paymentMethod;
        if (status === 'COMPLETA') {
          if (method !== 'CASH' && method !== 'TRANSFER' && method !== 'CHECK') {
            throw new Error('Debe indicar la forma de pago de la liquidación.');
          }
          const configResult = await getAppConfigSettings();
          const requireBankAccountsInPayments =
            configResult.data?.requireBankAccountsInPayments !== false;
          paymentMethod = method;
          paymentDetails = buildOutboundPaymentDetails(method, input.paymentDetails, {
            requireBankAccountsInPayments,
          });
        } else if (method === 'CASH' || method === 'TRANSFER' || method === 'CHECK') {
          paymentMethod = method;
          paymentDetails = {
            producerAccountId: input.paymentDetails?.producerAccountId,
            bankAccountId: input.paymentDetails?.bankAccountId,
            transactionId: input.paymentDetails?.transactionId,
            checkNumber: input.paymentDetails?.checkNumber,
          };
        }

        if (paymentDetails?.bankAccountId) {
          const bankAccount = await manager.getRepository(AdminBankAccount).findOne({
            where: { id: paymentDetails.bankAccountId },
          });
          if (!bankAccount || !bankAccount.isActive || bankAccount.deletedAt) {
            throw new Error('La cuenta bancaria de la administración seleccionada no está activa.');
          }
        }
      }

      const metadata: SettlementMetadata = {
        status,
        receptionTransactionIds: receptionIds,
        advanceApplications,
        receptionsTotalCLP,
        advancesAppliedCLP,
        netAmountCLP,
        ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
        ...(paymentMethod ? { paymentMethod } : {}),
        ...(paymentDetails ? { paymentDetails } : {}),
      };

      if (!settlement) {
        settlement = txRepo.create({
          type: TransactionType.SETTLEMENT,
          direction: TransactionDirection.OUT,
          unit: TransactionUnit.CLP,
          amount: netAmountCLP,
          seasonId,
          producerId,
          userId,
          metadata,
        });
      } else {
        settlement.amount = netAmountCLP;
        settlement.seasonId = seasonId;
        settlement.producerId = producerId;
        settlement.userId = userId;
        settlement.metadata = metadata;
      }
      await txRepo.save(settlement);
      const settlementIdStr = String(settlement.id);

      await relRepo.delete({
        childTransactionId: settlementIdStr,
        relationType: TransactionRelationType.RECEPTION_TO_SETTLEMENT,
      } as any);
      await relRepo.delete({
        childTransactionId: settlementIdStr,
        relationType: TransactionRelationType.ADVANCE_TO_SETTLEMENT,
      } as any);

      for (const reception of receptions) {
        await relRepo.save(
          relRepo.create({
            parentTransactionId: String(reception.id),
            childTransactionId: settlementIdStr,
            relationType: TransactionRelationType.RECEPTION_TO_SETTLEMENT,
            context: JSON.stringify({ source: 'saveSettlement' }),
          }),
        );
      }

      for (const app of advanceApplications) {
        await relRepo.save(
          relRepo.create({
            parentTransactionId: app.transactionId,
            childTransactionId: settlementIdStr,
            relationType: TransactionRelationType.ADVANCE_TO_SETTLEMENT,
            context: JSON.stringify({ amount: app.amount, source: 'saveSettlement' }),
          }),
        );
      }

      return settlementIdStr;
    });

    revalidatePath('/home/economicManagement/settlements');
    return { success: true, settlementId };
  } catch (error: any) {
    console.error('[saveSettlement]', error);
    return {
      success: false,
      error: error?.message || 'Error al guardar la liquidación.',
    };
  }
}

/** @deprecated Prefer saveSettlement */
export async function createSettlement(
  input: Omit<SaveSettlementInput, 'status'> & { status?: SettlementStatus },
): Promise<SaveSettlementResult> {
  return saveSettlement({ ...input, status: input.status ?? 'COMPLETA' });
}

export async function getSettlementForWizard(
  settlementId: string,
): Promise<{ success: true; data: SettlementWizardData } | { success: false; error: string }> {
  const id = settlementId?.trim();
  if (!id) {
    return { success: false, error: 'Liquidación no especificada.' };
  }

  try {
    const db = await getDb();
    const settlement = await db.getRepository(Transaction).findOne({
      where: {
        id: BigInt(id),
        type: TransactionType.SETTLEMENT,
        deletedAt: IsNull(),
      } as any,
    });

    if (!settlement) {
      return { success: false, error: 'Liquidación no encontrada.' };
    }

    const metadata = parseMetadata(settlement.metadata) as SettlementMetadata | null;
    const status = normalizeSettlementStatus(metadata?.status);
    if (status === 'COMPLETA') {
      return { success: false, error: 'Una liquidación completa no se puede reabrir.' };
    }
    if (!settlement.producerId) {
      return { success: false, error: 'La liquidación no tiene productor asociado.' };
    }

    return {
      success: true,
      data: {
        settlementId: String(settlement.id),
        producerId: settlement.producerId,
        status,
        receptionTransactionIds: Array.isArray(metadata?.receptionTransactionIds)
          ? metadata!.receptionTransactionIds.map(String)
          : [],
        advanceApplications: Array.isArray(metadata?.advanceApplications)
          ? metadata!.advanceApplications.map((app) => ({
              transactionId: String(app.transactionId),
              amount: Math.round(toNumber(app.amount, 0)),
            }))
          : [],
        receptionsTotalCLP: toNumber(metadata?.receptionsTotalCLP, 0),
        advancesAppliedCLP: toNumber(metadata?.advancesAppliedCLP, 0),
        netAmountCLP: toNumber(metadata?.netAmountCLP, toNumber(settlement.amount, 0)),
        notes: typeof metadata?.notes === 'string' ? metadata.notes : undefined,
        paymentMethod:
          metadata?.paymentMethod === 'CASH' ||
          metadata?.paymentMethod === 'TRANSFER' ||
          metadata?.paymentMethod === 'CHECK'
            ? metadata.paymentMethod
            : undefined,
        paymentDetails: metadata?.paymentDetails
          ? {
              producerAccountId: metadata.paymentDetails.producerAccountId,
              bankAccountId: metadata.paymentDetails.bankAccountId,
              transactionId: metadata.paymentDetails.transactionId,
              checkNumber: metadata.paymentDetails.checkNumber,
            }
          : undefined,
      },
    };
  } catch (error: any) {
    console.error('[getSettlementForWizard]', error);
    return { success: false, error: error?.message || 'Error al cargar la liquidación.' };
  }
}

export async function deleteSettlement(
  input: DeleteSettlementInput,
): Promise<DeleteSettlementResult> {
  const settlementId = input.settlementId?.trim();
  const userId = input.userId?.trim();
  if (!settlementId) {
    return { success: false, error: 'Liquidación no especificada.' };
  }
  if (!userId) {
    return { success: false, error: 'Usuario no autenticado.' };
  }

  try {
    const db = await getDb();
    await db.transaction(async (manager) => {
      const txRepo = manager.getRepository(Transaction);
      const relRepo = manager.getRepository(TransactionRelation);

      const settlement = await txRepo.findOne({
        where: {
          id: BigInt(settlementId),
          type: TransactionType.SETTLEMENT,
          deletedAt: IsNull(),
        } as any,
      });

      if (!settlement) {
        throw new Error('Liquidación no encontrada.');
      }

      await relRepo.delete({
        childTransactionId: settlementId,
        relationType: TransactionRelationType.RECEPTION_TO_SETTLEMENT,
      } as any);
      await relRepo.delete({
        childTransactionId: settlementId,
        relationType: TransactionRelationType.ADVANCE_TO_SETTLEMENT,
      } as any);

      await txRepo.softDelete({ id: BigInt(settlementId) } as any);
    });

    revalidatePath('/home/economicManagement/settlements');
    return { success: true };
  } catch (error: any) {
    console.error('[deleteSettlement]', error);
    return {
      success: false,
      error: error?.message || 'Error al eliminar la liquidación.',
    };
  }
}

export async function listSettlements(
  filters: ListSettlementsFilters = {},
): Promise<ListSettlementsResult> {
  const page = resolvePage(filters.page, 1);
  const limit = resolveLimit(filters.limit, 25, MAX_LIMIT);
  const sortField = resolveSortField(filters.sortField, SETTLEMENT_SORT_FIELDS, 'createdAt');
  const sortOrder = resolveSortOrder(filters.sort, 'DESC');
  const sortColumn = resolveSettlementSortColumn(sortField);

  const db = await getDb();
  const qb = db
    .getRepository(Transaction)
    .createQueryBuilder('settlement')
    .leftJoinAndSelect('settlement.producer', 'producer')
    .leftJoinAndSelect('settlement.season', 'season')
    .leftJoinAndSelect('settlement.user', 'operator')
    .leftJoin('operator.person', 'operatorPerson')
    .where('settlement.type = :type', { type: TransactionType.SETTLEMENT })
    .andWhere('settlement.deletedAt IS NULL');

  if (filters.producerId?.trim()) {
    qb.andWhere('settlement.producerId = :producerId', {
      producerId: filters.producerId.trim(),
    });
  }
  if (filters.seasonId?.trim()) {
    qb.andWhere('settlement.seasonId = :seasonId', { seasonId: filters.seasonId.trim() });
  }
  if (filters.from) {
    const fromDate = new Date(filters.from);
    if (!Number.isNaN(fromDate.getTime())) {
      qb.andWhere('settlement.createdAt >= :from', { from: fromDate });
    }
  }
  if (filters.to) {
    const toDate = new Date(filters.to);
    if (!Number.isNaN(toDate.getTime())) {
      qb.andWhere('settlement.createdAt <= :to', { to: toDate });
    }
  }

  applySettlementsGridFilters(qb, filters);

  const total = await qb.clone().getCount();
  const settlements = await qb
    .clone()
    .orderBy(sortColumn, sortOrder)
    .skip((page - 1) * limit)
    .take(limit)
    .getMany();

  const settlementIds = settlements.map((s) => String(s.id));
  const receptionCounts = new Map<string, { count: number; total: number }>();
  const advanceCounts = new Map<string, { count: number; total: number }>();

  if (settlementIds.length > 0) {
    const receptionRels = await db
      .getRepository(TransactionRelation)
      .createQueryBuilder('relation')
      .innerJoin(Transaction, 'reception', 'reception.id = relation.parentTransactionId')
      .select('relation.childTransactionId', 'settlementId')
      .addSelect('COUNT(relation.id)', 'count')
      .addSelect('COALESCE(SUM(reception.amount), 0)', 'totalAmount')
      .where('relation.relationType = :type', {
        type: TransactionRelationType.RECEPTION_TO_SETTLEMENT,
      })
      .andWhere('relation.childTransactionId IN (:...ids)', { ids: settlementIds })
      .groupBy('relation.childTransactionId')
      .getRawMany<{ settlementId: string; count: string; totalAmount: string }>();

    // Prefer metadata totals when present; fallback to SUM(amount)
    receptionRels.forEach((row) => {
      receptionCounts.set(String(row.settlementId), {
        count: Number(row.count ?? 0),
        total: toNumber(row.totalAmount, 0),
      });
    });

    const advanceRels = await db
      .getRepository(TransactionRelation)
      .createQueryBuilder('relation')
      .select('relation.childTransactionId', 'settlementId')
      .addSelect('relation.context', 'context')
      .where('relation.relationType = :type', {
        type: TransactionRelationType.ADVANCE_TO_SETTLEMENT,
      })
      .andWhere('relation.childTransactionId IN (:...ids)', { ids: settlementIds })
      .getRawMany<{ settlementId: string; context: string | null }>();

    advanceRels.forEach((row) => {
      const settlementId = String(row.settlementId);
      const amount = parseAdvanceRelationAmount(row.context);
      const prev = advanceCounts.get(settlementId) ?? { count: 0, total: 0 };
      prev.count += 1;
      prev.total += amount;
      advanceCounts.set(settlementId, prev);
    });
  }

  const rows: SettlementSummary[] = settlements.map((settlement) => {
    const id = String(settlement.id);
    const metadata = parseMetadata(settlement.metadata) as SettlementMetadata | null;
    const receptionMetaCount = metadata?.receptionTransactionIds?.length;
    const receptionMetaTotal = metadata?.receptionsTotalCLP;
    const advanceMetaCount = metadata?.advanceApplications?.length;
    const advanceMetaTotal = metadata?.advancesAppliedCLP;

    const receptionAgg = receptionCounts.get(id);
    const advanceAgg = advanceCounts.get(id);

    return {
      id,
      transactionId: id,
      createdAt: settlement.createdAt?.toISOString?.() ?? new Date().toISOString(),
      producerId: settlement.producerId,
      producerName: settlement.producer?.name ?? undefined,
      seasonId: settlement.seasonId,
      seasonName: settlement.season?.name ?? undefined,
      operatorId: settlement.userId,
      operatorName: settlement.user?.userName ?? undefined,
      status: normalizeSettlementStatus(metadata?.status),
      receptionsCount:
        typeof receptionMetaCount === 'number' ? receptionMetaCount : receptionAgg?.count ?? 0,
      receptionsTotalCLP:
        typeof receptionMetaTotal === 'number' ? receptionMetaTotal : receptionAgg?.total ?? 0,
      advancesCount:
        typeof advanceMetaCount === 'number' ? advanceMetaCount : advanceAgg?.count ?? 0,
      advancesAppliedCLP:
        typeof advanceMetaTotal === 'number' ? advanceMetaTotal : advanceAgg?.total ?? 0,
      netAmountCLP:
        typeof metadata?.netAmountCLP === 'number'
          ? metadata.netAmountCLP
          : toNumber(settlement.amount, 0),
      notes: typeof metadata?.notes === 'string' ? metadata.notes : undefined,
      paymentMethod:
        metadata?.paymentMethod === 'CASH' ||
        metadata?.paymentMethod === 'TRANSFER' ||
        metadata?.paymentMethod === 'CHECK'
          ? metadata.paymentMethod
          : null,
    };
  });

  return { rows, total, page, limit };
}
