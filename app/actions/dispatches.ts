'use server';

import { getDb } from '@/data/db';
import {
  Transaction,
  TransactionDirection,
  TransactionType,
  TransactionUnit,
  type DispatchMetadata,
  type DispatchPalletLine,
} from '@/data/entities/Transaction';
import { Tray } from '@/data/entities/Tray';
import { Pallet, PalletStatus } from '@/data/entities/Pallet';
import { Customer } from '@/data/entities/Customer';
import { Storage } from '@/data/entities/Storage';
import { Season } from '@/data/entities/Season';
import { User } from '@/data/entities/User';
import { Brackets, IsNull, SelectQueryBuilder } from 'typeorm';
import { revalidatePath } from 'next/cache';
import {
  applyTextSearch,
  normalizeSqlExpr,
  normalizeString,
  parseColumnFilters,
  resolveLimit,
  resolvePage,
  resolveSortField,
  resolveSortOrder,
} from '@/lib/gridQuery';
import type { TrayDeliveryMetadata } from '@/data/entities/Transaction';

export type CreateDispatchPalletInput = {
  emptyWeightKg: number;
  traysQuantity: number;
  grossWeightKg: number;
};

export type CreateDispatchInput = {
  customerId: string;
  trayId: string;
  storageId: string;
  userId: string;
  seasonId?: string;
  notes?: string;
  pallets: CreateDispatchPalletInput[];
};

export type DispatchSummaryRow = {
  id: string;
  createdAt: string;
  customerId: string;
  customerName: string;
  trayId: string;
  trayName: string;
  palletsCount: number;
  traysTotal: number;
  fruitKgTotal: number;
  grossKgTotal: number;
};

export type DispatchDetail = DispatchSummaryRow & {
  storageId: string;
  storageName: string;
  unitTrayWeight: number;
  trayOutTransactionId?: string;
  notes?: string;
  palletLines: Array<DispatchPalletLine & { palletId: number }>;
};

function normalizeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function fruitWeightKg(
  grossWeightKg: number,
  emptyWeightKg: number,
  traysQuantity: number,
  unitTrayWeight: number,
): number {
  return grossWeightKg - emptyWeightKg - traysQuantity * unitTrayWeight;
}

export async function createDispatch(
  input: CreateDispatchInput,
): Promise<{ success: boolean; data?: { dispatchId: string }; error?: string }> {
  try {
    const customerId = input.customerId?.trim();
    const trayId = input.trayId?.trim();
    const storageId = input.storageId?.trim();
    const userId = input.userId?.trim();
    const pallets = Array.isArray(input.pallets) ? input.pallets : [];

    if (!customerId || !trayId || !storageId || !userId) {
      return { success: false, error: 'Cliente, bandeja, almacén y usuario son requeridos.' };
    }
    if (pallets.length === 0) {
      return { success: false, error: 'Debe agregar al menos un pallet.' };
    }

    const db = await getDb();

    const result = await db.transaction(async (manager) => {
      const [customer, tray, storage, user] = await Promise.all([
        manager.getRepository(Customer).findOne({
          where: { id: customerId, deletedAt: IsNull() },
          relations: { person: true },
        }),
        manager.getRepository(Tray).findOne({
          where: { id: trayId, deletedAt: IsNull(), active: true },
        }),
        manager.getRepository(Storage).findOne({
          where: { id: storageId, deletedAt: IsNull() },
        }),
        manager.getRepository(User).findOne({
          where: { id: userId, deletedAt: IsNull() },
          relations: { person: true },
        }),
      ]);

      if (!customer) throw new Error('Cliente no encontrado.');
      if (!tray) throw new Error('Tipo de bandeja no encontrado.');
      if (!storage) throw new Error('Almacén no encontrado.');
      if (!user) throw new Error('Usuario no encontrado.');

      let seasonId = input.seasonId?.trim();
      if (!seasonId) {
        const season = await manager.getRepository(Season).findOne({
          where: { active: true, deletedAt: IsNull() },
        });
        if (!season) throw new Error('No hay temporada activa.');
        seasonId = season.id;
      }

      const unitTrayWeight = normalizeNumber(tray.weight, 0);
      if (unitTrayWeight < 0) throw new Error('Peso de bandeja inválido.');

      const lines: Array<DispatchPalletLine & { emptyWeightKg: number; traysQuantity: number; grossWeightKg: number }> =
        [];
      let traysTotal = 0;
      let fruitKgTotal = 0;
      let grossKgTotal = 0;

      for (const [index, raw] of pallets.entries()) {
        const emptyWeightKg = normalizeNumber(raw.emptyWeightKg, NaN);
        const traysQuantity = Math.floor(normalizeNumber(raw.traysQuantity, NaN));
        const grossWeightKg = normalizeNumber(raw.grossWeightKg, NaN);

        if (!Number.isFinite(emptyWeightKg) || emptyWeightKg < 0) {
          throw new Error(`Pallet #${index + 1}: peso vacío inválido.`);
        }
        if (!Number.isFinite(traysQuantity) || traysQuantity <= 0) {
          throw new Error(`Pallet #${index + 1}: cantidad de bandejas inválida.`);
        }
        if (!Number.isFinite(grossWeightKg) || grossWeightKg <= 0) {
          throw new Error(`Pallet #${index + 1}: peso bruto inválido.`);
        }

        const fruit = fruitWeightKg(grossWeightKg, emptyWeightKg, traysQuantity, unitTrayWeight);
        if (fruit < -0.001) {
          throw new Error(
            `Pallet #${index + 1}: el peso bruto no cubre tara + bandejas (fruta negativa).`,
          );
        }

        const fruitRounded = Number(Math.max(0, fruit).toFixed(3));
        lines.push({
          emptyWeightKg,
          traysQuantity,
          grossWeightKg,
          fruitWeightKg: fruitRounded,
        });
        traysTotal += traysQuantity;
        fruitKgTotal += fruitRounded;
        grossKgTotal += grossWeightKg;
      }

      const stockBefore = normalizeNumber(tray.stock, 0);
      if (traysTotal > stockBefore) {
        throw new Error(
          `Stock insuficiente de bandejas (${tray.name}): disponibles ${stockBefore}, requeridas ${traysTotal}.`,
        );
      }
      const stockAfter = stockBefore - traysTotal;
      await manager.update(Tray, trayId, { stock: stockAfter });

      const nowIso = new Date().toISOString();
      const customerName = customer.person?.name?.trim() || 'Cliente';

      const trayOutMeta: TrayDeliveryMetadata = {
        trayId,
        quantity: traysTotal,
        stockBefore,
        stockAfter,
        reason: 'Despacho a cliente',
        performedBy: userId,
        performedByName: user.person?.name ?? user.userName,
        performedAt: nowIso,
        counterpartyType: 'client',
        counterpartyId: customerId,
        counterpartyName: customerName,
      };

      const trayOut = await manager.save(
        manager.create(Transaction, {
          type: TransactionType.TRAY_OUT_TO_CLIENT,
          direction: TransactionDirection.OUT,
          unit: TransactionUnit.TRAY,
          amount: traysTotal,
          seasonId,
          clientId: customerId,
          userId,
          metadata: trayOutMeta as any,
        }),
      );

      const createdPalletIds: number[] = [];
      const savedLines: Array<DispatchPalletLine & { palletId: number }> = [];

      for (const line of lines) {
        const capacity = Math.max(line.traysQuantity, 1);
        const pallet = await manager.save(
          manager.create(Pallet, {
            storageId,
            trayId,
            traysQuantity: line.traysQuantity,
            capacity,
            weight: line.emptyWeightKg,
            dispatchWeight: line.grossWeightKg,
            status: PalletStatus.DISPATCHED,
            metadata: {
              fruitWeightKg: line.fruitWeightKg,
              emptyWeightKg: line.emptyWeightKg,
              traysQuantity: line.traysQuantity,
              grossWeightKg: line.grossWeightKg,
              trayId,
            },
          }),
        );

        const palletId = Number(pallet.id);
        createdPalletIds.push(palletId);
        savedLines.push({ ...line, palletId });
      }

      const dispatchMeta: DispatchMetadata = {
        status: 'COMPLETA',
        customerId,
        customerName,
        trayId,
        trayName: tray.name,
        storageId,
        storageName: storage.name,
        unitTrayWeight,
        palletIds: createdPalletIds,
        trayOutTransactionId: String(trayOut.id),
        palletsCount: createdPalletIds.length,
        traysTotal,
        fruitKgTotal: Number(fruitKgTotal.toFixed(3)),
        grossKgTotal: Number(grossKgTotal.toFixed(3)),
        palletLines: savedLines,
        ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
      };

      const dispatch = await manager.save(
        manager.create(Transaction, {
          type: TransactionType.DISPATCH,
          direction: TransactionDirection.OUT,
          unit: TransactionUnit.KG,
          amount: dispatchMeta.fruitKgTotal,
          seasonId,
          clientId: customerId,
          userId,
          metadata: dispatchMeta as any,
        }),
      );

      const dispatchId = String(dispatch.id);
      for (const palletId of createdPalletIds) {
        const pallet = await manager.getRepository(Pallet).findOne({ where: { id: palletId } });
        if (!pallet) continue;
        const prevMeta =
          pallet.metadata && typeof pallet.metadata === 'object' && !Array.isArray(pallet.metadata)
            ? pallet.metadata
            : {};
        await manager.update(Pallet, palletId, {
          metadata: {
            ...prevMeta,
            dispatchTransactionId: dispatchId,
          },
        });
      }

      return { dispatchId };
    });

    revalidatePath('/home/dispatch/dispatches');
    revalidatePath('/home/dispatch/new');
    revalidatePath('/home/storage/trays');
    revalidatePath('/home/storage/pallets');

    return { success: true, data: result };
  } catch (error: any) {
    console.error('[createDispatch] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al crear el despacho',
    };
  }
}

const DISPATCH_META_CUSTOMER = "JSON_UNQUOTE(JSON_EXTRACT(tx.metadata, '$.customerName'))";
const DISPATCH_META_TRAY = "JSON_UNQUOTE(JSON_EXTRACT(tx.metadata, '$.trayName'))";
const DISPATCH_META_PALLETS = "JSON_EXTRACT(tx.metadata, '$.palletsCount')";
const DISPATCH_META_TRAYS = "JSON_EXTRACT(tx.metadata, '$.traysTotal')";
const DISPATCH_META_FRUIT = "JSON_EXTRACT(tx.metadata, '$.fruitKgTotal')";

const DISPATCH_SORT_FIELDS = [
  'createdAt',
  'id',
  'customerName',
  'trayName',
  'fruitKgTotal',
  'traysTotal',
  'palletsCount',
] as const;

const DISPATCH_FILTER_COLUMNS = [
  'id',
  'createdAt',
  'customerName',
  'trayName',
  'palletsCount',
  'traysTotal',
  'fruitKgTotal',
] as const;

export type ListDispatchesInput = {
  page?: number;
  limit?: number;
  search?: string;
  filtration?: boolean;
  filters?: string;
  sortField?: string;
  sort?: string;
};

function shouldApplyDispatchColumnFilters(input: ListDispatchesInput): boolean {
  return input.filtration === true || Boolean(input.filters?.trim());
}

function resolveDispatchSortColumn(sortField: string): string {
  switch (sortField) {
    case 'id':
      return 'tx.id';
    case 'customerName':
      return DISPATCH_META_CUSTOMER;
    case 'trayName':
      return DISPATCH_META_TRAY;
    case 'fruitKgTotal':
      return `COALESCE(${DISPATCH_META_FRUIT}, tx.amount)`;
    case 'traysTotal':
      return DISPATCH_META_TRAYS;
    case 'palletsCount':
      return DISPATCH_META_PALLETS;
    case 'createdAt':
    default:
      return 'tx.createdAt';
  }
}

function applyDispatchesGridFilters(
  qb: SelectQueryBuilder<Transaction>,
  input: ListDispatchesInput,
): void {
  if (input.search?.trim()) {
    applyTextSearch(qb, {
      columns: [
        'CAST(tx.id AS CHAR)',
        DISPATCH_META_CUSTOMER,
        DISPATCH_META_TRAY,
        "DATE_FORMAT(tx.createdAt, '%d-%m-%Y')",
        "DATE_FORMAT(tx.createdAt, '%Y-%m-%d')",
        `CAST(COALESCE(${DISPATCH_META_FRUIT}, tx.amount) AS CHAR)`,
        `CAST(${DISPATCH_META_TRAYS} AS CHAR)`,
        `CAST(${DISPATCH_META_PALLETS} AS CHAR)`,
      ],
      search: input.search,
      paramName: 'dispatchSearch',
    });
  }

  if (shouldApplyDispatchColumnFilters(input) && input.filters) {
    const columnFilters = parseColumnFilters(input.filters, DISPATCH_FILTER_COLUMNS);
    columnFilters.forEach((filter, index) => {
      const paramName = `dispatchColFilter${index}`;
      const normalized = normalizeString(filter.value);
      switch (filter.column) {
        case 'id':
          qb.andWhere(`CAST(tx.id AS CHAR) LIKE :${paramName}`, {
            [paramName]: `%${filter.value.trim()}%`,
          });
          break;
        case 'createdAt':
          qb.andWhere('DATE(tx.createdAt) = :dispatchColDate', { dispatchColDate: filter.value });
          break;
        case 'customerName':
          qb.andWhere(`${normalizeSqlExpr(DISPATCH_META_CUSTOMER)} LIKE :${paramName}`, {
            [paramName]: `%${normalized}%`,
          });
          break;
        case 'trayName':
          qb.andWhere(`${normalizeSqlExpr(DISPATCH_META_TRAY)} LIKE :${paramName}`, {
            [paramName]: `%${normalized}%`,
          });
          break;
        case 'palletsCount':
          qb.andWhere(`CAST(${DISPATCH_META_PALLETS} AS CHAR) LIKE :${paramName}`, {
            [paramName]: `%${filter.value.trim()}%`,
          });
          break;
        case 'traysTotal':
          qb.andWhere(`CAST(${DISPATCH_META_TRAYS} AS CHAR) LIKE :${paramName}`, {
            [paramName]: `%${filter.value.trim()}%`,
          });
          break;
        case 'fruitKgTotal':
          qb.andWhere(
            new Brackets((sub) => {
              sub
                .where(`CAST(${DISPATCH_META_FRUIT} AS CHAR) LIKE :${paramName}`, {
                  [paramName]: `%${filter.value.trim()}%`,
                })
                .orWhere(`CAST(tx.amount AS CHAR) LIKE :${paramName}`, {
                  [paramName]: `%${filter.value.trim()}%`,
                });
            }),
          );
          break;
        default:
          break;
      }
    });
  }
}

export async function listDispatches(
  input: ListDispatchesInput = {},
): Promise<{ rows: DispatchSummaryRow[]; total: number; page: number; limit: number }> {
  const page = resolvePage(input.page, 1);
  const limit = resolveLimit(input.limit, 25);
  const sortField = resolveSortField(input.sortField, DISPATCH_SORT_FIELDS, 'createdAt');
  const sortOrder = resolveSortOrder(input.sort, 'DESC');
  const sortColumn = resolveDispatchSortColumn(sortField);

  try {
    const db = await getDb();
    const qb = db
      .getRepository(Transaction)
      .createQueryBuilder('tx')
      .where('tx.type = :type', { type: TransactionType.DISPATCH })
      .andWhere('tx.deletedAt IS NULL');

    applyDispatchesGridFilters(qb, input);

    const total = await qb.clone().getCount();
    const rowsRaw = await qb
      .clone()
      .orderBy(sortColumn, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const rows: DispatchSummaryRow[] = rowsRaw.map((tx) => {
      const meta = (tx.metadata ?? {}) as DispatchMetadata;
      return {
        id: String(tx.id),
        createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : '',
        customerId: meta.customerId ?? tx.clientId ?? '',
        customerName: meta.customerName ?? '—',
        trayId: meta.trayId ?? '',
        trayName: meta.trayName ?? '—',
        palletsCount: meta.palletsCount ?? meta.palletIds?.length ?? 0,
        traysTotal: meta.traysTotal ?? 0,
        fruitKgTotal: meta.fruitKgTotal ?? normalizeNumber(tx.amount, 0),
        grossKgTotal: meta.grossKgTotal ?? 0,
      };
    });

    return { rows, total, page, limit };
  } catch (error) {
    console.error('[listDispatches] Error:', error);
    return { rows: [], total: 0, page, limit };
  }
}

export async function getDispatchDetail(
  dispatchId: string,
): Promise<{ success: boolean; data?: DispatchDetail; error?: string }> {
  try {
    if (!dispatchId?.trim()) {
      return { success: false, error: 'ID de despacho inválido' };
    }
    const db = await getDb();
    const tx = await db.getRepository(Transaction).findOne({
      where: { id: BigInt(dispatchId) as any, type: TransactionType.DISPATCH, deletedAt: IsNull() },
    });
    if (!tx) {
      return { success: false, error: 'Despacho no encontrado' };
    }
    const meta = (tx.metadata ?? {}) as DispatchMetadata;
    const palletLines = Array.isArray(meta.palletLines)
      ? meta.palletLines.map((line) => ({
          ...line,
          palletId: Number(line.palletId ?? 0),
        }))
      : [];

    return {
      success: true,
      data: {
        id: String(tx.id),
        createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : '',
        customerId: meta.customerId ?? tx.clientId ?? '',
        customerName: meta.customerName ?? '—',
        trayId: meta.trayId ?? '',
        trayName: meta.trayName ?? '—',
        storageId: meta.storageId ?? '',
        storageName: meta.storageName ?? '—',
        unitTrayWeight: meta.unitTrayWeight ?? 0,
        trayOutTransactionId: meta.trayOutTransactionId,
        notes: meta.notes,
        palletsCount: meta.palletsCount ?? palletLines.length,
        traysTotal: meta.traysTotal ?? 0,
        fruitKgTotal: meta.fruitKgTotal ?? 0,
        grossKgTotal: meta.grossKgTotal ?? 0,
        palletLines,
      },
    };
  } catch (error: any) {
    console.error('[getDispatchDetail] Error:', error);
    return { success: false, error: error?.message || 'Error al cargar el despacho' };
  }
}

export async function getTraysWithStockForDispatch(): Promise<
  Array<{ id: string; label: string; weight: number; stock: number }>
> {
  try {
    const db = await getDb();
    const trays = await db.getRepository(Tray).find({
      where: { active: true, deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
    return trays.map((tray) => ({
      id: tray.id,
      label: tray.name,
      weight: normalizeNumber(tray.weight, 0),
      stock: normalizeNumber(tray.stock, 0),
    }));
  } catch (error) {
    console.error('[getTraysWithStockForDispatch] Error:', error);
    return [];
  }
}
