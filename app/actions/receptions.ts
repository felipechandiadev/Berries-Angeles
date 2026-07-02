'use server';

import { DataSource, EntityManager, In, IsNull } from 'typeorm';
import { getDb } from '../../data/db';
import { Transaction, TransactionDirection, TransactionType, TransactionUnit, TransactionMetadata } from '../../data/entities/Transaction';
import { ReceptionPack } from '../../data/entities/ReceptionPack';
import { TransactionRelation, TransactionRelationType } from '../../data/entities/TransactionRelation';
import { Pallet, PalletMetadata, PalletStatus, PalletTrayAssignment } from '../../data/entities/Pallet';
import { Tray } from '../../data/entities/Tray';
import { Audit } from '../../data/entities/Audit';
import { AuditActionType } from '../../data/entities/audit.types';
import { Season } from '../../data/entities/Season';
import { Producer } from '../../data/entities/Producer';
import { User } from '../../data/entities/User';
import { Currency } from '../../data/entities/Variety';
import { getCurrentUserSession } from './auth.server';
import { revalidatePath } from 'next/cache';
import { formatAuditDate } from '../../lib/dateTimeUtils';
import {
  type ReceptionDetailData,
  type ReceptionDetailHistoryItem,
  type ReceptionDetailPack,
  type ReceptionDetailProducerInfo,
  type ReceptionDetailRelatedMovementGroup,
  type ReceptionDetailRelatedMovement,
  type ReceptionDetailResponse,
  type ReceptionDetailTotals,
  type ReceptionDetailTrayReturn,
  type ReceptionRelationType,
  type ReceptionTransactionDirection,
  type ReceptionTransactionType,
  type ReceptionTransactionUnit,
} from '@/app/home/receptions/receptions/ui/ReceptionDetail/types';

export interface ReceptionProducerOption {
  id: string | number;
  label: string;
}

export interface ReceptionPackAssignmentInput {
  palletId: number;
  traysAssigned: number;
}

export interface ProcessReceptionPackInput {
  packNumber: number;
  varietyId: number;
  varietyName: string | null;
  formatId: number;
  formatName: string | null;
  trayId: string | null;
  trayLabel: string | null;
  traysQuantity: number;
  unitTrayWeight: number;
  traysTotalWeight: number;
  grossWeight: number;
  netWeightBeforeImpurities: number;
  netWeight: number;
  impurityPercent: number;
  price: number;
  currency: Currency | null;
  totalToPay: number;
  palletAssignments: ReceptionPackAssignmentInput[];
}

export interface TrayDevolutionInput {
  trayId: string | null;
  trayLabel?: string | null;
  quantity: number;
}

export interface ProcessReceptionTotalsInput {
  totalPacks: number;
  totalTraysInPacks: number;
  totalTraysDevolved: number;
  totalGrossWeight: number;
  totalNetWeight: number;
  totalToPayUSD: number;
  totalToPayCLP: number;
  totalCLPToPay: number;
}

export interface ProcessReceptionInput {
  producer: ReceptionProducerOption | null;
  guide: string;
  packs: ProcessReceptionPackInput[];
  trayDevolutions: TrayDevolutionInput[];
  totals: ProcessReceptionTotalsInput;
  exchangeRate: number;
  userId?: string;
}

export interface ProcessReceptionResult {
  success: boolean;
  data?: {
    receptionTransactionId: string;
  };
  error?: string;
}

export type RemoveReceptionPackHandlingMode = 'adjust' | 'return';

export interface RemoveReceptionPackInput {
  receptionTransactionId: string;
  packId: string;
  handlingMode: RemoveReceptionPackHandlingMode;
  reason: string;
  notes?: string;
  userId?: string;
}

export interface RemoveReceptionPackResult {
  success: boolean;
  data?: {
    receptionTransactionId: string;
    removedPackId: string;
    trayTransactionId?: string;
    palletReleaseTransactionIds: string[];
  };
  error?: string;
}

interface ResolvedUser {
  id: string;
  name: string;
}

const DEFAULT_EXCHANGE_RATE = 0;

const normalizeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

async function resolveUser(manager: EntityManager, explicitUserId?: string): Promise<ResolvedUser> {
  let userId: string | undefined = explicitUserId;

  if (!userId) {
    try {
      const { userId: sessionUserId } = await getCurrentUserSession();
      userId = sessionUserId;
    } catch (error) {
      // Ignored: fall back to first user if not available
    }
  }

  let user: User | null = null;

  if (userId) {
    user = await manager.getRepository(User).findOne({ where: { id: userId } });
  }

  if (!user) {
    const [fallbackUser] = await manager.getRepository(User).find({
      order: { userName: 'ASC' },
      take: 1,
    });
    user = fallbackUser ?? null;
  }

  if (!user) {
    throw new Error('No hay usuarios disponibles para asociar a la transacción');
  }

  return {
    id: user.id,
    name: user.person?.name ?? user.userName,
  };
}

async function resolveActiveSeason(manager: EntityManager): Promise<Season> {
  const season = await manager.getRepository(Season).findOne({
    where: { active: true },
    order: { startDate: 'DESC' },
  });

  if (!season) {
    throw new Error('No hay una temporada activa configurada. Configura una temporada activa antes de registrar recepciones.');
  }

  return season;
}

async function resolveProducer(manager: EntityManager, producerOption: ReceptionProducerOption | null): Promise<{ id: string | undefined; name: string | undefined; entity: Producer | null; }> {
  if (!producerOption?.id) {
    return { id: undefined, name: undefined, entity: null };
  }

  const producerId = String(producerOption.id);
  const producer = await manager.getRepository(Producer).findOne({ where: { id: producerId } });

  if (!producer) {
    throw new Error('El productor seleccionado no existe');
  }

  return {
    id: producer.id,
    name: producer.name,
    entity: producer,
  };
}

export async function processReception(input: ProcessReceptionInput): Promise<ProcessReceptionResult> {
  try {
    if (!input || !Array.isArray(input.packs) || input.packs.length === 0) {
      return { success: false, error: 'Debes registrar al menos un pack para procesar la recepción.' };
    }

    const db: DataSource = await getDb();

    const result = await db.transaction(async (manager) => {
      const user = await resolveUser(manager, input.userId);
      const season = await resolveActiveSeason(manager);
      const producerData = await resolveProducer(manager, input.producer);

      const exchangeRate = normalizeNumber(input.exchangeRate, DEFAULT_EXCHANGE_RATE);
      const totals = input.totals;
      const totalCLPToPay = normalizeNumber(totals?.totalCLPToPay ?? (totals?.totalToPayCLP ?? 0) + (totals?.totalToPayUSD ?? 0) * exchangeRate, 0);

      const now = new Date();
      const nowIso = now.toISOString();

      const receptionTransaction = manager.create(Transaction, {
        type: TransactionType.RECEPTION,
        direction: TransactionDirection.OUT,
        unit: TransactionUnit.CLP,
        amount: Number(totalCLPToPay.toFixed(2)),
        seasonId: season.id,
        producerId: producerData.id,
        userId: user.id,
      });

      const savedReceptionTransaction = await manager.save(Transaction, receptionTransaction);
      const receptionTransactionId = String(savedReceptionTransaction.id);

      const uniqueVarietyIds = new Set<number>();
      const uniqueFormatIds = new Set<number>();
      const uniqueTrayTypeIds = new Set<string>();

      const savedPacks: Array<{ pack: ProcessReceptionPackInput; entity: ReceptionPack; }> = [];

      for (const pack of input.packs) {
        if (!pack.varietyId || !pack.formatId) {
          throw new Error('Cada pack debe tener una variedad y un formato seleccionados.');
        }

        const traysQuantity = Math.max(0, normalizeNumber(pack.traysQuantity));
        const unitTrayWeight = normalizeNumber(pack.unitTrayWeight);
        const traysTotalWeight = normalizeNumber(pack.traysTotalWeight);
        const grossWeight = normalizeNumber(pack.grossWeight);
        const netWeightBeforeImpurities = normalizeNumber(pack.netWeightBeforeImpurities);
        const netWeight = normalizeNumber(pack.netWeight);
        const impurityPercent = normalizeNumber(pack.impurityPercent);
        const pricePerKg = normalizeNumber(pack.price);
        const totalToPay = normalizeNumber(pack.totalToPay);

        uniqueVarietyIds.add(pack.varietyId);
        uniqueFormatIds.add(pack.formatId);
        if (pack.trayId) {
          uniqueTrayTypeIds.add(String(pack.trayId));
        }

        const receptionPack = manager.create(ReceptionPack, {
          receptionTransactionId,
          varietyId: pack.varietyId,
          varietyName: pack.varietyName ?? '',
          formatId: pack.formatId,
          formatName: pack.formatName ?? '',
          trayId: pack.trayId,
          trayLabel: pack.trayLabel ?? null,
          traysQuantity,
          unitTrayWeight,
          traysTotalWeight,
          grossWeight,
          netWeightBeforeImpurities,
          impurityPercent,
          netWeight,
          pricePerKg,
          currency: pack.currency ?? Currency.CLP,
          totalToPay,
          palletAssignments: (pack.palletAssignments ?? []).map((assignment) => ({
            palletId: assignment.palletId,
            traysAssigned: normalizeNumber(assignment.traysAssigned),
          })),
        });

        const savedPack = await manager.save(ReceptionPack, receptionPack);
        savedPacks.push({ pack, entity: savedPack });

        const relation = manager.create(TransactionRelation, {
          parentTransactionId: receptionTransactionId,
          childTransactionId: null,
          childReceptionPackId: savedPack.id,
          relationType: TransactionRelationType.RECEPTION_PACK,
          context: `pack ${pack.packNumber}`,
        });

        await manager.save(TransactionRelation, relation);
      }

      const palletAssignmentTransactions: Array<{ transaction: Transaction; pack: ProcessReceptionPackInput; palletId: number; traysAssigned: number; }>
        = [];

      for (const { pack, entity } of savedPacks) {
        const assignments = Array.isArray(pack.palletAssignments) ? pack.palletAssignments : [];

        for (const assignment of assignments) {
          const traysAssigned = normalizeNumber(assignment.traysAssigned);
          if (!assignment.palletId || traysAssigned <= 0) {
            continue;
          }

          const pallet = await manager.getRepository(Pallet).findOne({ where: { id: assignment.palletId } });
          if (!pallet) {
            throw new Error(`El pallet ${assignment.palletId} no existe.`);
          }

          const currentTraysQuantity = normalizeNumber(pallet.traysQuantity);
          const nextTraysQuantity = currentTraysQuantity + traysAssigned;
          const palletTraysBefore = currentTraysQuantity;
          const palletTraysAfter = nextTraysQuantity;

          const metadata: PalletMetadata = Array.isArray(pallet.metadata) ? [...pallet.metadata] : [];

          const trayIdForMetadata = pack.trayId ? String(pack.trayId) : 'N/A';
          const existingAssignment = metadata.find((item: PalletTrayAssignment) =>
            item.receptionPackId === String(entity.id) && item.trayId === trayIdForMetadata
          );

          if (existingAssignment) {
            existingAssignment.quantity += traysAssigned;
          } else {
            metadata.push({
              receptionPackId: String(entity.id),
              trayId: trayIdForMetadata,
              quantity: traysAssigned,
            });
          }

          pallet.traysQuantity = nextTraysQuantity;
          if (pallet.capacity && nextTraysQuantity >= pallet.capacity) {
            pallet.status = PalletStatus.FULL;
          } else if (nextTraysQuantity === 0) {
            pallet.status = PalletStatus.AVAILABLE;
          }
          pallet.metadata = metadata;

          await manager.save(Pallet, pallet);

          const assignmentTransaction = manager.create(Transaction, {
            type: TransactionType.PALLET_TRAY_ASSIGNMENT,
            direction: TransactionDirection.IN,
            unit: TransactionUnit.TRAY,
            amount: Number(traysAssigned.toFixed(2)),
            seasonId: season.id,
            producerId: producerData.id,
            userId: user.id,
            metadata: ({
              receptionTransactionId,
              receptionPackId: entity.id,
              packNumber: pack.packNumber,
              palletId: assignment.palletId,
              trayId: pack.trayId,
              trayLabel: pack.trayLabel,
              traysAssigned,
              palletTraysBefore,
              palletTraysAfter,
              performedBy: user.id,
              performedByName: user.name,
              performedAt: nowIso,
            } as any),
          });

          const savedAssignmentTransaction = await manager.save(Transaction, assignmentTransaction);

          const assignmentRelation = manager.create(TransactionRelation, {
            parentTransactionId: receptionTransactionId,
            childTransactionId: String(savedAssignmentTransaction.id),
            relationType: TransactionRelationType.PALLET_ASSIGNMENT,
            context: `pack ${pack.packNumber} → pallet ${assignment.palletId}`,
          });

          await manager.save(TransactionRelation, assignmentRelation);

          palletAssignmentTransactions.push({
            transaction: savedAssignmentTransaction,
            pack,
            palletId: assignment.palletId,
            traysAssigned,
          });
        }
      }

      const trayIdsToLoad = new Set<string>();
      for (const { pack } of savedPacks) {
        if (pack.trayId) {
          trayIdsToLoad.add(String(pack.trayId));
        }
      }
      for (const trayDevolution of input.trayDevolutions ?? []) {
        if (trayDevolution.trayId) {
          trayIdsToLoad.add(String(trayDevolution.trayId));
        }
      }

      const trayById = new Map<string, Tray>();
      if (trayIdsToLoad.size > 0) {
        const trays = await manager.getRepository(Tray).find({
          where: { id: In(Array.from(trayIdsToLoad)) },
        });

        trays.forEach((tray) => {
          trayById.set(tray.id, tray);
        });

        const missingTrayIds = Array.from(trayIdsToLoad).filter((trayId) => !trayById.has(trayId));
        if (missingTrayIds.length > 0) {
          throw new Error(`No se pudieron encontrar las bandejas: ${missingTrayIds.join(', ')}`);
        }
      }

      const trayReceptionAggregates = new Map<string, {
        trayId: string | null;
        trayLabel: string | null;
        quantity: number;
        packIds: number[];
        packNumbers: number[];
      }>();

      for (const { pack, entity } of savedPacks) {
        const key = pack.trayId ? String(pack.trayId) : `__no_tray__${pack.packNumber}`;
        if (!trayReceptionAggregates.has(key)) {
          trayReceptionAggregates.set(key, {
            trayId: pack.trayId,
            trayLabel: pack.trayLabel ?? null,
            quantity: 0,
            packIds: [],
            packNumbers: [],
          });
        }

        const aggregate = trayReceptionAggregates.get(key)!;
        aggregate.quantity += normalizeNumber(pack.traysQuantity);
        aggregate.packIds.push(entity.id);
        aggregate.packNumbers.push(pack.packNumber);
      }

      const trayReceptionTransactions: Array<{ transaction: Transaction; trayId: string; trayLabel: string | null; quantity: number; packIds: number[]; stockBefore: number; stockAfter: number; }> = [];

      for (const aggregate of trayReceptionAggregates.values()) {
        if (!aggregate.trayId || aggregate.quantity <= 0) {
          continue;
        }

        const trayId = String(aggregate.trayId);
        const trayEntity = trayById.get(trayId);
        if (!trayEntity) {
          throw new Error(`La bandeja ${aggregate.trayLabel ?? trayId} no existe o fue eliminada`);
        }

        const stockBefore = Number(trayEntity.stock ?? 0);
        const stockAfter = stockBefore + normalizeNumber(aggregate.quantity);
        trayEntity.stock = stockAfter;
        await manager.save(Tray, trayEntity);
        trayById.set(trayEntity.id, trayEntity);

        const trayReceptionTransaction = manager.create(Transaction, {
          type: TransactionType.TRAY_IN_FROM_PRODUCER,
          direction: TransactionDirection.IN,
          unit: TransactionUnit.TRAY,
          amount: Number(aggregate.quantity.toFixed(2)),
          seasonId: season.id,
          producerId: producerData.id,
          userId: user.id,
          metadata: ({
            receptionTransactionId,
            trayId,
            trayLabel: aggregate.trayLabel,
            quantity: aggregate.quantity,
            stockBefore,
            stockAfter,
            packReceptionIds: aggregate.packIds,
            packNumbers: aggregate.packNumbers,
          } as any),
        });

        const savedTrayReception = await manager.save(Transaction, trayReceptionTransaction);

        const trayRelation = manager.create(TransactionRelation, {
          parentTransactionId: receptionTransactionId,
          childTransactionId: String(savedTrayReception.id),
          relationType: TransactionRelationType.TRAY_RECEPTION,
          context: aggregate.trayLabel ? `tray ${aggregate.trayLabel}` : `tray ${aggregate.trayId}`,
        });

        await manager.save(TransactionRelation, trayRelation);

        trayReceptionTransactions.push({
          transaction: savedTrayReception,
          trayId,
          trayLabel: aggregate.trayLabel,
          quantity: aggregate.quantity,
          packIds: aggregate.packIds,
          stockBefore,
          stockAfter,
        });
      }

      const trayDevolutionTransactions: Array<{ transaction: Transaction; trayId: string; trayLabel: string | null; quantity: number; stockBefore: number; stockAfter: number; }> = [];

      for (const trayDevolution of input.trayDevolutions ?? []) {
        const quantity = normalizeNumber(trayDevolution.quantity);
        if (!trayDevolution.trayId || quantity <= 0) {
          continue;
        }

        const trayId = String(trayDevolution.trayId);
        const trayEntity = trayById.get(trayId);
        if (!trayEntity) {
          throw new Error(`La bandeja ${trayDevolution.trayLabel ?? trayId} no existe o fue eliminada`);
        }

        uniqueTrayTypeIds.add(trayId);

        const stockBefore = Number(trayEntity.stock ?? 0);
        const stockAfter = stockBefore - quantity;
        if (stockAfter < 0) {
          throw new Error(`Stock insuficiente de bandejas (${trayDevolution.trayLabel ?? trayId}) para registrar la devolución`);
        }

        trayEntity.stock = stockAfter;
        await manager.save(Tray, trayEntity);
        trayById.set(trayEntity.id, trayEntity);

        const trayOutTransaction = manager.create(Transaction, {
          type: TransactionType.TRAY_OUT_TO_PRODUCER,
          direction: TransactionDirection.OUT,
          unit: TransactionUnit.TRAY,
          amount: Number(quantity.toFixed(2)),
          seasonId: season.id,
          producerId: producerData.id,
          userId: user.id,
          metadata: ({
            receptionTransactionId,
            trayId,
            trayLabel: trayDevolution.trayLabel ?? null,
            quantityReturned: quantity,
            stockBefore,
            stockAfter,
          } as any),
        });

        const savedTrayOut = await manager.save(Transaction, trayOutTransaction);

        const trayDevolutionRelation = manager.create(TransactionRelation, {
          parentTransactionId: receptionTransactionId,
          childTransactionId: String(savedTrayOut.id),
          relationType: TransactionRelationType.TRAY_DEVOLUTION,
          context: `tray ${trayDevolution.trayLabel ?? trayDevolution.trayId} · qty ${quantity}`,
        });

        await manager.save(TransactionRelation, trayDevolutionRelation);

        trayDevolutionTransactions.push({
          transaction: savedTrayOut,
          trayId,
          trayLabel: trayDevolution.trayLabel ?? null,
          quantity,
          stockBefore,
          stockAfter,
        });
      }

      const metadataPacks = savedPacks.map(({ pack, entity }) => ({
        packId: entity.id,
        packNumber: pack.packNumber,
        varietyId: pack.varietyId,
        varietyName: pack.varietyName,
        formatId: pack.formatId,
        formatName: pack.formatName,
        trayId: pack.trayId,
        trayLabel: pack.trayLabel,
        traysQuantity: normalizeNumber(pack.traysQuantity),
        unitTrayWeightKg: normalizeNumber(pack.unitTrayWeight),
        traysTotalWeightKg: normalizeNumber(pack.traysTotalWeight),
        grossWeightKg: normalizeNumber(pack.grossWeight),
        netWeightBeforeImpuritiesKg: normalizeNumber(pack.netWeightBeforeImpurities),
        netWeightKg: normalizeNumber(pack.netWeight),
        impurityPercent: normalizeNumber(pack.impurityPercent),
        currency: pack.currency ?? Currency.CLP,
        pricePerKg: normalizeNumber(pack.price),
        totalToPay: normalizeNumber(pack.totalToPay),
        palletAssignments: (pack.palletAssignments ?? []).map((assignment) => ({
          palletId: assignment.palletId,
          traysAssigned: normalizeNumber(assignment.traysAssigned),
        })),
      }));

      const metadataTrayReturns = trayDevolutionTransactions.map((item) => ({
        transactionId: String(item.transaction.id),
        trayId: item.trayId,
        trayLabel: item.trayLabel,
        quantityReturned: normalizeNumber(item.quantity),
        stockBefore: normalizeNumber(item.stockBefore),
        stockAfter: normalizeNumber(item.stockAfter),
      }));

      const changesHistory = [
        {
          changedAt: nowIso,
          changedBy: user.id,
          changedByName: user.name,
          summary: 'Registro inicial de la recepción',
          details: [
            { field: 'exchangeRate', previousValue: null, newValue: exchangeRate },
            { field: 'totalCLPToPay', previousValue: null, newValue: totalCLPToPay },
          ],
        },
      ];

      const receptionMetadata = {
        producerId: producerData.id,
        producerName: producerData.name ?? input.producer?.label ?? null,
        guideNumber: input.guide || null,
        varietyIds: Array.from(uniqueVarietyIds),
        formatIds: Array.from(uniqueFormatIds),
        trayTypeIds: Array.from(uniqueTrayTypeIds),
        packs: metadataPacks,
        trayReturns: metadataTrayReturns,
        totals: {
          packsCount: totals?.totalPacks ?? metadataPacks.length,
          traysInPacks: totals?.totalTraysInPacks ?? metadataPacks.reduce((sum, pack) => sum + pack.traysQuantity, 0),
          trayReturns: totals?.totalTraysDevolved ?? metadataTrayReturns.reduce((sum, item) => sum + item.quantityReturned, 0),
          grossWeightKg: totals?.totalGrossWeight ?? metadataPacks.reduce((sum, pack) => sum + pack.grossWeightKg, 0),
          netWeightKg: totals?.totalNetWeight ?? metadataPacks.reduce((sum, pack) => sum + pack.netWeightKg, 0),
          trayWeightKg: metadataPacks.reduce((sum, pack) => sum + pack.traysTotalWeightKg, 0),
          payableCLP: totals?.totalToPayCLP ?? metadataPacks
            .filter((pack) => pack.currency === Currency.CLP)
            .reduce((sum, pack) => sum + pack.totalToPay, 0),
          payableUSD: totals?.totalToPayUSD ?? metadataPacks
            .filter((pack) => pack.currency === Currency.USD)
            .reduce((sum, pack) => sum + pack.totalToPay, 0),
          totalCLPToPay,
        },
        exchangeRate,
        totalCLPToPay,
        changesHistory,
      };

      await manager.update(Transaction, savedReceptionTransaction.id, {
        metadata: receptionMetadata as any,
      });

      return {
        receptionTransactionId,
      };
    });

    return {
      success: true,
      data: {
        receptionTransactionId: result.receptionTransactionId,
      },
    };
  } catch (error: any) {
    console.error('[processReception] Error processing reception:', error);
    return {
      success: false,
      error: error?.message ?? 'Error desconocido al procesar la recepción',
    };
  }
}

export async function removeReceptionPack(input: RemoveReceptionPackInput): Promise<RemoveReceptionPackResult> {
  const receptionTransactionId = input?.receptionTransactionId?.toString().trim();
  const packIdRaw = input?.packId?.toString().trim();
  const handlingMode: RemoveReceptionPackHandlingMode = input?.handlingMode === 'return' ? 'return' : 'adjust';
  const reason = (input?.reason ?? '').trim();
  const notes = (input?.notes ?? '').trim() || undefined;

  if (!receptionTransactionId) {
    return { success: false, error: 'Debes proporcionar el identificador de la recepción.' };
  }

  if (!packIdRaw) {
    return { success: false, error: 'Debes indicar el pack que deseas eliminar.' };
  }

  if (!reason) {
    return { success: false, error: 'Debes especificar el motivo de la eliminación del pack.' };
  }

  const packId = Number(packIdRaw);
  if (!Number.isFinite(packId)) {
    return { success: false, error: 'El identificador del pack no es válido.' };
  }

  try {
    const db = await getDb();
    const queryRunner = db.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      const reception = await manager.getRepository(Transaction).findOne({
        where: {
          id: receptionTransactionId as unknown as any,
          type: TransactionType.RECEPTION,
          deletedAt: IsNull(),
        },
      });

      if (!reception) {
        await queryRunner.rollbackTransaction();
        return { success: false, error: 'La recepción no existe o ya fue eliminada.' };
      }

      const user = await resolveUser(manager, input.userId);
      const now = new Date();
      const nowIso = now.toISOString();

      const packRepository = manager.getRepository(ReceptionPack);
      const pack = await packRepository.findOne({
        where: {
          id: packId,
          receptionTransactionId: String(reception.id),
        },
      });

      if (!pack) {
        await queryRunner.rollbackTransaction();
        return { success: false, error: 'El pack indicado no pertenece a esta recepción o ya fue eliminado.' };
      }

      let receptionMetadata: Record<string, any> = {};
      if (reception.metadata) {
        try {
          receptionMetadata = typeof reception.metadata === 'string'
            ? JSON.parse(reception.metadata)
            : { ...(reception.metadata as Record<string, any>) };
        } catch (metadataError) {
          console.warn('[removeReceptionPack] No se pudo parsear la metadata de la recepción, se utilizará un objeto vacío.', metadataError);
        }
      }

      const metadataPacks = Array.isArray(receptionMetadata.packs)
        ? [...receptionMetadata.packs]
        : [];

      const metadataPackIndex = metadataPacks.findIndex((entry: any) =>
        entry && String(entry.packId ?? entry.id) === String(pack.id)
      );

      const metadataPack = metadataPackIndex >= 0 ? metadataPacks[metadataPackIndex] : null;

      const packNumberRaw = metadataPack?.packNumber;
      const packNumber = typeof packNumberRaw === 'number'
        ? packNumberRaw
        : Number.isFinite(Number(packNumberRaw))
          ? Number(packNumberRaw)
          : null;

      const traysQuantity = normalizeNumber(metadataPack?.traysQuantity, normalizeNumber(pack.traysQuantity, 0));
      const grossWeightKg = normalizeNumber(metadataPack?.grossWeightKg, normalizeNumber(pack.grossWeight, 0));
      const netWeightKg = normalizeNumber(metadataPack?.netWeightKg, normalizeNumber(pack.netWeight, 0));
      const trayWeightKg = normalizeNumber(metadataPack?.traysTotalWeightKg, normalizeNumber(pack.traysTotalWeight, 0));
      const pricePerKg = normalizeNumber(metadataPack?.pricePerKg, normalizeNumber(pack.pricePerKg, 0));
      const packCurrency = String(metadataPack?.currency ?? pack.currency ?? Currency.CLP).toUpperCase();
      const totalToPay = normalizeNumber(metadataPack?.totalToPay, normalizeNumber(pack.totalToPay, 0));

      const exchangeRate = normalizeNumber(receptionMetadata?.exchangeRate, DEFAULT_EXCHANGE_RATE);
      const totalCLPImpact = packCurrency === 'USD'
        ? normalizeNumber(totalToPay * (exchangeRate || 0), 0)
        : normalizeNumber(totalToPay, 0);

      if (packCurrency === 'USD' && totalToPay > 0 && exchangeRate <= 0) {
        await queryRunner.rollbackTransaction();
        return { success: false, error: 'No se puede eliminar el pack porque la recepción no tiene un tipo de cambio válido para USD.' };
      }

      const totalsRaw = receptionMetadata?.totals ?? {};
      const totalsBefore = {
        packsCount: normalizeNumber(totalsRaw?.packsCount, metadataPacks.length),
        traysInPacks: normalizeNumber(totalsRaw?.traysInPacks, 0),
        trayReturns: normalizeNumber(totalsRaw?.trayReturns, 0),
        grossWeightKg: normalizeNumber(totalsRaw?.grossWeightKg, 0),
        netWeightKg: normalizeNumber(totalsRaw?.netWeightKg, 0),
        trayWeightKg: normalizeNumber(totalsRaw?.trayWeightKg, 0),
        payableCLP: normalizeNumber(totalsRaw?.payableCLP, 0),
        payableUSD: normalizeNumber(totalsRaw?.payableUSD, 0),
        totalCLPToPay: normalizeNumber(totalsRaw?.totalCLPToPay ?? receptionMetadata?.totalCLPToPay ?? reception.amount, 0),
      };

      const newTotals = {
        packsCount: Math.max(0, totalsBefore.packsCount - 1),
        traysInPacks: Math.max(0, totalsBefore.traysInPacks - traysQuantity),
        trayReturns: handlingMode === 'return'
          ? Math.max(0, totalsBefore.trayReturns + traysQuantity)
          : Math.max(0, totalsBefore.trayReturns),
        grossWeightKg: Math.max(0, totalsBefore.grossWeightKg - grossWeightKg),
        netWeightKg: Math.max(0, totalsBefore.netWeightKg - netWeightKg),
        trayWeightKg: Math.max(0, totalsBefore.trayWeightKg - trayWeightKg),
        payableCLP: Math.max(0, totalsBefore.payableCLP - (packCurrency === 'CLP' ? totalToPay : 0)),
        payableUSD: Math.max(0, totalsBefore.payableUSD - (packCurrency === 'USD' ? totalToPay : 0)),
        totalCLPToPay: Math.max(0, totalsBefore.totalCLPToPay - totalCLPImpact),
      };

      const palletReleaseTransactionIds: string[] = [];
      let trayTransactionId: string | undefined;

      const assignmentsRaw = Array.isArray(pack.palletAssignments) ? pack.palletAssignments : [];
      for (const assignment of assignmentsRaw) {
        const palletId = assignment?.palletId;
        const traysAssigned = normalizeNumber(assignment?.traysAssigned, 0);
        if (!palletId || traysAssigned <= 0) {
          continue;
        }

        const pallet = await manager.getRepository(Pallet).findOne({ where: { id: palletId } });
        if (!pallet) {
          throw new Error(`El pallet ${palletId} no existe; no se puede revertir la asignación.`);
        }

        const traysBefore = normalizeNumber(pallet.traysQuantity, 0);
        if (traysBefore < traysAssigned) {
          throw new Error(`El pallet ${palletId} no tiene bandejas suficientes para revertir la asignación.`);
        }

        const traysAfter = traysBefore - traysAssigned;

        const metadataArray = Array.isArray(pallet.metadata)
          ? [...pallet.metadata]
          : [];

        const trayMetadataId = pack.trayId ? String(pack.trayId) : 'N/A';
        const assignmentIndex = metadataArray.findIndex((item: PalletTrayAssignment) =>
          String(item.receptionPackId) === String(pack.id) && String(item.trayId) === trayMetadataId
        );

        if (assignmentIndex >= 0) {
          const currentQuantity = normalizeNumber(metadataArray[assignmentIndex].quantity, 0) - traysAssigned;
          if (currentQuantity > 0) {
            metadataArray[assignmentIndex] = {
              ...metadataArray[assignmentIndex],
              quantity: currentQuantity,
            };
          } else {
            metadataArray.splice(assignmentIndex, 1);
          }
        }

        pallet.traysQuantity = traysAfter;
        if (pallet.capacity && traysAfter >= pallet.capacity) {
          pallet.status = PalletStatus.FULL;
        } else if (traysAfter === 0) {
          pallet.status = PalletStatus.AVAILABLE;
        }
        pallet.metadata = metadataArray.length ? (metadataArray as PalletMetadata) : null;

        await manager.save(Pallet, pallet);

        const palletRelease = manager.create(Transaction, {
          type: TransactionType.PALLET_TRAY_RELEASE,
          direction: TransactionDirection.OUT,
          unit: TransactionUnit.TRAY,
          amount: Number(traysAssigned.toFixed(2)),
          seasonId: reception.seasonId,
          producerId: reception.producerId,
          userId: user.id,
          metadata: ({
            receptionTransactionId: String(reception.id),
            receptionPackId: pack.id,
            packNumber,
            palletId,
            trayId: pack.trayId ?? null,
            trayLabel: pack.trayLabel ?? null,
            traysReleased: traysAssigned,
            palletTraysBefore: traysBefore,
            palletTraysAfter: traysAfter,
            reason,
            notes: notes ?? null,
            performedBy: user.id,
            performedByName: user.name,
            performedAt: nowIso,
            handlingMode,
          } as any),
        });

        const savedPalletRelease = await manager.save(Transaction, palletRelease);
        palletReleaseTransactionIds.push(String(savedPalletRelease.id));

        const palletReleaseRelation = manager.create(TransactionRelation, {
          parentTransactionId: String(reception.id),
          childTransactionId: String(savedPalletRelease.id),
          relationType: TransactionRelationType.PALLET_RELEASE,
          context: `pack ${packNumber ?? pack.id} → pallet ${palletId}`,
        });
        await manager.save(TransactionRelation, palletReleaseRelation);
      }

      if (traysQuantity > 0 && pack.trayId) {
        const tray = await manager.getRepository(Tray).findOne({
          where: {
            id: pack.trayId,
            deletedAt: IsNull(),
          },
        });

        if (!tray) {
          throw new Error(`La bandeja asociada (${pack.trayLabel ?? pack.trayId}) no existe o fue eliminada.`);
        }

        const stockBefore = normalizeNumber(tray.stock, 0);
        const stockAfter = stockBefore - traysQuantity;
        if (stockAfter < 0) {
          throw new Error('No hay stock suficiente de bandejas para completar la eliminación del pack.');
        }

        tray.stock = stockAfter;
        await manager.save(Tray, tray);

        if (handlingMode === 'return') {
          const trayReturn = manager.create(Transaction, {
            type: TransactionType.TRAY_OUT_TO_PRODUCER,
            direction: TransactionDirection.OUT,
            unit: TransactionUnit.TRAY,
            amount: Number(traysQuantity.toFixed(2)),
            seasonId: reception.seasonId,
            producerId: reception.producerId,
            userId: user.id,
            metadata: ({
              receptionTransactionId: String(reception.id),
              receptionPackId: pack.id,
              packNumber,
              trayId: tray.id,
              trayLabel: pack.trayLabel ?? null,
              quantityReturned: traysQuantity,
              stockBefore,
              stockAfter,
              reason,
              notes: notes ?? null,
              performedBy: user.id,
              performedByName: user.name,
              performedAt: nowIso,
              handlingMode,
            } as any),
          });

          const savedTrayReturn = await manager.save(Transaction, trayReturn);
          trayTransactionId = String(savedTrayReturn.id);

          const trayReturnRelation = manager.create(TransactionRelation, {
            parentTransactionId: String(reception.id),
            childTransactionId: String(savedTrayReturn.id),
            relationType: TransactionRelationType.TRAY_DEVOLUTION,
            context: `pack ${packNumber ?? pack.id} · ${traysQuantity} bandejas`,
          });
          await manager.save(TransactionRelation, trayReturnRelation);

          const trayReturns = Array.isArray(receptionMetadata?.trayReturns)
            ? [...receptionMetadata.trayReturns]
            : [];
          trayReturns.push({
            transactionId: String(savedTrayReturn.id),
            trayId: tray.id,
            trayLabel: pack.trayLabel ?? null,
            quantityReturned: traysQuantity,
            stockBefore,
            stockAfter,
            reason,
            notes: notes ?? null,
            createdAt: nowIso,
          });
          receptionMetadata.trayReturns = trayReturns;
        } else {
          const trayAdjustment = manager.create(Transaction, {
            type: TransactionType.TRAY_ADJUSTMENT,
            direction: TransactionDirection.OUT,
            unit: TransactionUnit.TRAY,
            amount: Number(traysQuantity.toFixed(2)),
            seasonId: reception.seasonId,
            producerId: reception.producerId,
            userId: user.id,
            metadata: ({
              reason,
              notes: notes ?? null,
              trayId: tray.id,
              previousStock: stockBefore,
              newStock: stockAfter,
              receptionTransactionId: String(reception.id),
              receptionPackId: pack.id,
              packNumber,
              performedBy: user.id,
              performedByName: user.name,
              performedAt: nowIso,
              handlingMode,
              operation: 'packRemoval',
            } as any),
          });

          const savedTrayAdjustment = await manager.save(Transaction, trayAdjustment);
          trayTransactionId = String(savedTrayAdjustment.id);

          const trayAdjustmentRelation = manager.create(TransactionRelation, {
            parentTransactionId: String(reception.id),
            childTransactionId: String(savedTrayAdjustment.id),
            relationType: TransactionRelationType.TRAY_ADJUSTMENT,
            context: `pack ${packNumber ?? pack.id} · ${traysQuantity} bandejas`,
          });
          await manager.save(TransactionRelation, trayAdjustmentRelation);
        }
      }

      if (metadataPackIndex >= 0) {
        metadataPacks.splice(metadataPackIndex, 1);
      }
      receptionMetadata.packs = metadataPacks;

      receptionMetadata.totals = newTotals;
      receptionMetadata.totalCLPToPay = newTotals.totalCLPToPay;

      const removedPacks = Array.isArray(receptionMetadata.removedPacks)
        ? [...receptionMetadata.removedPacks]
        : [];
      removedPacks.push({
        packId: pack.id,
        packNumber,
        removedAt: nowIso,
        handledBy: user.id,
        handledByName: user.name,
        handlingMode,
        reason,
        notes: notes ?? null,
        traysQuantity,
        grossWeightKg,
        netWeightKg,
        trayWeightKg,
        pricePerKg,
        totalToPay,
        currency: packCurrency,
        trayTransactionId: trayTransactionId ?? null,
        palletReleaseTransactionIds,
      });
      receptionMetadata.removedPacks = removedPacks;

      const historyEntries = Array.isArray(receptionMetadata?.changesHistory)
        ? [...receptionMetadata.changesHistory]
        : [];
      historyEntries.push({
        changedAt: nowIso,
        changedBy: user.id,
        changedByName: user.name,
        summary: `Pack ${packNumber ?? pack.id} eliminado (${handlingMode === 'return' ? 'devolución a productor' : 'ajuste interno'})`,
        details: [
          {
            field: 'packsCount',
            previousValue: totalsBefore.packsCount,
            newValue: newTotals.packsCount,
          },
          {
            field: 'traysInPacks',
            previousValue: totalsBefore.traysInPacks,
            newValue: newTotals.traysInPacks,
          },
          {
            field: 'totalCLPToPay',
            previousValue: totalsBefore.totalCLPToPay,
            newValue: newTotals.totalCLPToPay,
          },
        ],
      });
      receptionMetadata.changesHistory = historyEntries;

      const newReceptionAmount = Number(newTotals.totalCLPToPay.toFixed(2));

      await manager.update(Transaction, reception.id, {
        amount: newReceptionAmount,
        metadata: receptionMetadata as any,
      });

      await packRepository.delete(pack.id);

      const audit = manager.create(Audit, {
        entityName: 'ReceptionPack',
        entityId: String(pack.id),
        userId: user.id,
        action: AuditActionType.DELETE,
        description: `Pack ${packNumber ?? pack.id} eliminado de la recepción ${receptionTransactionId}.`,
        oldValues: {
          receptionTransactionId: String(reception.id),
          packId: pack.id,
          packNumber,
          traysQuantity,
          totalToPay,
          currency: packCurrency,
        },
        changes: {
          fields: ['packs', 'totals', 'transactions'],
          summary: `Eliminación de pack ${packNumber ?? pack.id}`,
          changeCount: 1,
        },
        createdAt: now,
      });
      await manager.save(Audit, audit);

      await queryRunner.commitTransaction();

      revalidatePath('/home/receptions/receptions');

      return {
        success: true,
        data: {
          receptionTransactionId,
          removedPackId: String(pack.id),
          trayTransactionId,
          palletReleaseTransactionIds,
        },
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error('[removeReceptionPack] Error al eliminar pack:', error);
      return {
        success: false,
        error: error?.message ?? 'Error inesperado al eliminar el pack de la recepción.',
      };
    } finally {
      await queryRunner.release();
    }
  } catch (error: any) {
    console.error('[removeReceptionPack] Error general:', error);
    return {
      success: false,
      error: error?.message ?? 'Error inesperado al eliminar el pack de la recepción.',
    };
  }
}

/**
 * ============================================================
 * FUNCIONES PARA LISTAR RECEPCIONES EN DATA GRID
 * ============================================================
 */

const RECEPTION_GRID_VALID_FIELDS = [
  'id',
  'producerName',
  'guideNumber',
  'varieties',
  'totalTrays',
  'grossWeightKg',
  'netWeightKg',
  'payableCLP',
  'payableUSD',
  'exchangeRate',
  'totalCLP',
  'createdAt',
];

const RECEPTION_GRID_SORT_FIELDS = [
  'id',
  'producerName',
  'guideNumber',
  'totalTrays',
  'grossWeightKg',
  'netWeightKg',
  'payableCLP',
  'payableUSD',
  'exchangeRate',
  'totalCLP',
  'createdAt',
];

const RECEPTION_FILTERABLE_FIELDS = [
  'id',
  'producerName',
  'guideNumber',
  'totalTrays',
  'grossWeightKg',
  'netWeightKg',
  'payableCLP',
  'payableUSD',
  'exchangeRate',
  'totalCLP',
];

const JSON_PRODUCER = "JSON_UNQUOTE(JSON_EXTRACT(tx.metadata, '$.producerName'))";
const JSON_GUIDE = "JSON_UNQUOTE(JSON_EXTRACT(tx.metadata, '$.guideNumber'))";
const JSON_TOTAL_TRAYS = "JSON_EXTRACT(tx.metadata, '$.totals.traysInPacks')";
const JSON_GROSS_WEIGHT = "JSON_EXTRACT(tx.metadata, '$.totals.grossWeightKg')";
const JSON_NET_WEIGHT = "JSON_EXTRACT(tx.metadata, '$.totals.netWeightKg')";
const JSON_PAYABLE_CLP = "JSON_EXTRACT(tx.metadata, '$.totals.payableCLP')";
const JSON_PAYABLE_USD = "JSON_EXTRACT(tx.metadata, '$.totals.payableUSD')";
const JSON_EXCHANGE_RATE = "JSON_EXTRACT(tx.metadata, '$.exchangeRate')";
const JSON_TOTAL_CLP = "JSON_EXTRACT(tx.metadata, '$.totals.totalCLPToPay')";

const NUMERIC_COLUMN_SQL_MAP: Record<string, string> = {
  totalTrays: `COALESCE(${JSON_TOTAL_TRAYS}, 0)`,
  grossWeightKg: `COALESCE(${JSON_GROSS_WEIGHT}, 0)`,
  netWeightKg: `COALESCE(${JSON_NET_WEIGHT}, 0)`,
  payableCLP: `COALESCE(${JSON_PAYABLE_CLP}, 0)`,
  payableUSD: `COALESCE(${JSON_PAYABLE_USD}, 0)`,
  exchangeRate: `COALESCE(${JSON_EXCHANGE_RATE}, 0)`,
  totalCLP: `COALESCE(${JSON_TOTAL_CLP}, 0)`,
};

const SORT_SQL_MAP: Record<string, string> = {
  id: 'tx.id',
  producerName: 'producerName',
  guideNumber: 'guideNumber',
  totalTrays: 'totalTrays',
  grossWeightKg: 'grossWeightKg',
  netWeightKg: 'netWeightKg',
  payableCLP: 'payableCLP',
  payableUSD: 'payableUSD',
  exchangeRate: 'exchangeRate',
  totalCLP: 'totalCLP',
  createdAt: 'tx.createdAt',
};

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/ü/g, 'u');
}

function parseColumnFilters(
  filtersString: string,
  allowedFields: string[]
): Array<{ column: string; value: string }> {
  return filtersString
    .split(',')
    .map((filter) => filter.trim())
    .filter((filter) => filter.includes('-'))
    .map((filter) => {
      const dashIndex = filter.indexOf('-');
      return {
        column: filter.substring(0, dashIndex).trim(),
        value: decodeURIComponent(filter.substring(dashIndex + 1).trim()),
      };
    })
    .filter((item) => item.column && item.value && allowedFields.includes(item.column));
}

const normalizeSqlExpression = (expression: string) =>
  `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(COALESCE(${expression}, '')), 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'), 'ñ', 'n'), 'ü', 'u')`;

const toReceptionMetadata = (value: unknown) => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('[toReceptionMetadata] No se pudo parsear metadata:', error);
      return null;
    }
  }
  return value as Record<string, any> | null;
};

export interface ReceptionGridRow {
  id: string;
  producerName: string;
  guideNumber: string;
  varieties: string[];
  totalTrays: number;
  grossWeightKg: number;
  netWeightKg: number;
  payableCLP: number;
  payableUSD: number;
  exchangeRate: number;
  totalCLP: number;
  createdAt?: string;
}

export interface ReceptionsGridFilters {
  fields?: string;
  page?: number;
  limit?: number;
  search?: string;
  filtration?: boolean;
  filters?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

export interface ReceptionsGridResponse {
  data: ReceptionGridRow[];
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
}

interface RawReceptionRow {
  id: string;
  producerName: string | null;
  guideNumber: string | null;
  totalTrays: string | number | null;
  grossWeightKg: string | number | null;
  netWeightKg: string | number | null;
  payableCLP: string | number | null;
  payableUSD: string | number | null;
  exchangeRate: string | number | null;
  totalCLP: string | number | null;
  createdAt: Date | string;
  metadata: any;
}

const buildReceptionsBaseQuery = (dataSource: DataSource) =>
  dataSource
    .getRepository(Transaction)
    .createQueryBuilder('tx')
    .select('tx.id', 'id')
    .addSelect('tx.createdAt', 'createdAt')
    .addSelect(JSON_PRODUCER, 'producerName')
    .addSelect(JSON_GUIDE, 'guideNumber')
    .addSelect(`${JSON_TOTAL_TRAYS}`, 'totalTrays')
    .addSelect(`${JSON_GROSS_WEIGHT}`, 'grossWeightKg')
    .addSelect(`${JSON_NET_WEIGHT}`, 'netWeightKg')
    .addSelect(`${JSON_PAYABLE_CLP}`, 'payableCLP')
    .addSelect(`${JSON_PAYABLE_USD}`, 'payableUSD')
    .addSelect(`${JSON_EXCHANGE_RATE}`, 'exchangeRate')
    .addSelect(`${JSON_TOTAL_CLP}`, 'totalCLP')
    .addSelect('tx.metadata', 'metadata')
    .where('tx.type = :type', { type: TransactionType.RECEPTION })
    .andWhere('tx.deletedAt IS NULL');

const formatReceptionRow = (raw: RawReceptionRow): ReceptionGridRow => {
  const metadata = toReceptionMetadata(raw.metadata) || {};
  const totals = metadata?.totals ?? {};
  const packs = Array.isArray(metadata?.packs) ? metadata.packs : [];

  const varietyNames = packs
    .map((pack: any) => (typeof pack?.varietyName === 'string' ? pack.varietyName.trim() : undefined))
    .filter((value: string | undefined): value is string => Boolean(value && value.length > 0));

  const uniqueVarieties = Array.from(new Set<string>(varietyNames));

  const totalTrays = normalizeNumber(raw.totalTrays ?? totals?.traysInPacks, 0);
  const grossWeightKg = normalizeNumber(raw.grossWeightKg ?? totals?.grossWeightKg, 0);
  const netWeightKg = normalizeNumber(raw.netWeightKg ?? totals?.netWeightKg, 0);
  const payableCLP = normalizeNumber(raw.payableCLP ?? totals?.payableCLP, 0);
  const payableUSD = normalizeNumber(raw.payableUSD ?? totals?.payableUSD, 0);
  const exchangeRate = normalizeNumber(raw.exchangeRate ?? metadata?.exchangeRate, 0);
  const totalCLP = normalizeNumber(
    raw.totalCLP ?? totals?.totalCLPToPay ?? metadata?.totalCLPToPay,
    0
  );

  return {
    id: raw.id ? String(raw.id) : '',
    producerName: raw.producerName || metadata?.producerName || '—',
    guideNumber: raw.guideNumber || metadata?.guideNumber || '—',
    varieties: uniqueVarieties,
    totalTrays,
    grossWeightKg,
    netWeightKg,
    payableCLP,
    payableUSD,
    exchangeRate,
    totalCLP,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : undefined,
  };
};

export async function getReceptionsGridData(
  filters?: ReceptionsGridFilters
): Promise<ReceptionsGridResponse> {
  try {
    const dataSource = await getDb();

    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(Math.max(5, filters?.limit || 25), 100);
    const sortBy = filters?.sortBy && RECEPTION_GRID_SORT_FIELDS.includes(filters.sortBy)
      ? filters.sortBy
      : 'createdAt';
    const sortOrder = (filters?.sortOrder || 'DESC').toString().toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const query = buildReceptionsBaseQuery(dataSource);

    if (filters?.filtration && filters.filters) {
      const columnFilters = parseColumnFilters(filters.filters, RECEPTION_FILTERABLE_FIELDS);

      columnFilters.forEach((filter, index) => {
        const paramName = `colFilter${index}`;
        if (filter.column === 'id') {
          query.andWhere(`CAST(tx.id AS CHAR) LIKE :${paramName}`, {
            [paramName]: `%${filter.value}%`,
          });
          return;
        }

        if (NUMERIC_COLUMN_SQL_MAP[filter.column]) {
          const numericValue = Number(filter.value);
          if (!Number.isNaN(numericValue)) {
            query.andWhere(`${NUMERIC_COLUMN_SQL_MAP[filter.column]} = :${paramName}`, {
              [paramName]: numericValue,
            });
          }
          return;
        }

        if (filter.column === 'producerName') {
          query.andWhere(`${normalizeSqlExpression(JSON_PRODUCER)} LIKE :${paramName}`, {
            [paramName]: `%${normalizeString(filter.value)}%`,
          });
          return;
        }

        if (filter.column === 'guideNumber') {
          query.andWhere(`${normalizeSqlExpression(JSON_GUIDE)} LIKE :${paramName}`, {
            [paramName]: `%${normalizeString(filter.value)}%`,
          });
        }
      });
    }

    if (filters?.search?.trim()) {
      const normalizedSearch = `%${normalizeString(filters.search.trim())}%`;
      query.andWhere(
        `(${normalizeSqlExpression(JSON_PRODUCER)} LIKE :search OR ${normalizeSqlExpression(JSON_GUIDE)} LIKE :search OR CAST(tx.id AS CHAR) LIKE :search)`,
        { search: normalizedSearch }
      );
    }

    const countResult = await query.clone().select('COUNT(*)', 'count').getRawOne<{ count: string | number }>();
    const total = Number(countResult?.count ?? 0);
    const pages = Math.max(1, Math.ceil(total / limit));

    const sortExpression = SORT_SQL_MAP[sortBy] || 'tx.createdAt';

    const rawRows = await query
      .clone()
      .orderBy(sortExpression, sortOrder as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany<RawReceptionRow>();

    const data = rawRows.map(formatReceptionRow);

    return {
      data,
      total,
      pages,
      currentPage: page,
      limit,
    };
  } catch (error) {
    console.error('[getReceptionsGridData] Error:', error);
    return {
      data: [],
      total: 0,
      pages: 0,
      currentPage: 1,
      limit: filters?.limit || 25,
    };
  }
}

export async function getReceptionsExportData(filters?: ReceptionsGridFilters): Promise<{
  success: boolean;
  data?: ReceptionGridRow[];
  recordCount?: number;
  error?: string;
}> {
  try {
    const dataSource = await getDb();
    const maxRows = 10000;

    const sortBy = filters?.sortBy && RECEPTION_GRID_SORT_FIELDS.includes(filters.sortBy)
      ? filters.sortBy
      : 'createdAt';
    const sortOrder = (filters?.sortOrder || 'DESC').toString().toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const query = buildReceptionsBaseQuery(dataSource);

    if (filters?.filtration && filters.filters) {
      const columnFilters = parseColumnFilters(filters.filters, RECEPTION_FILTERABLE_FIELDS);
      columnFilters.forEach((filter, index) => {
        const paramName = `exportFilter${index}`;

        if (filter.column === 'id') {
          query.andWhere(`CAST(tx.id AS CHAR) LIKE :${paramName}`, {
            [paramName]: `%${filter.value}%`,
          });
          return;
        }

        if (NUMERIC_COLUMN_SQL_MAP[filter.column]) {
          const numericValue = Number(filter.value);
          if (!Number.isNaN(numericValue)) {
            query.andWhere(`${NUMERIC_COLUMN_SQL_MAP[filter.column]} = :${paramName}`, {
              [paramName]: numericValue,
            });
          }
          return;
        }

        if (filter.column === 'producerName') {
          query.andWhere(`${normalizeSqlExpression(JSON_PRODUCER)} LIKE :${paramName}`, {
            [paramName]: `%${normalizeString(filter.value)}%`,
          });
          return;
        }

        if (filter.column === 'guideNumber') {
          query.andWhere(`${normalizeSqlExpression(JSON_GUIDE)} LIKE :${paramName}`, {
            [paramName]: `%${normalizeString(filter.value)}%`,
          });
        }
      });
    }

    if (filters?.search?.trim()) {
      const normalizedSearch = `%${normalizeString(filters.search.trim())}%`;
      query.andWhere(
        `(${normalizeSqlExpression(JSON_PRODUCER)} LIKE :search OR ${normalizeSqlExpression(JSON_GUIDE)} LIKE :search OR CAST(tx.id AS CHAR) LIKE :search)`,
        { search: normalizedSearch }
      );
    }

    const sortExpression = SORT_SQL_MAP[sortBy] || 'tx.createdAt';

    const rawRows = await query
      .orderBy(sortExpression, sortOrder as 'ASC' | 'DESC')
      .take(maxRows + 1)
      .getRawMany<RawReceptionRow>();

    if (rawRows.length > maxRows) {
      return {
        success: false,
        error: `Total de registros (${rawRows.length}) excede el límite permitido de ${maxRows}. Refine los filtros.`,
      };
    }

    const data = rawRows.map(formatReceptionRow);

    return {
      success: true,
      data,
      recordCount: data.length,
    };
  } catch (error) {
    console.error('[getReceptionsExportData] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al exportar recepciones',
    };
  }
}

const RELATION_TYPE_LABELS: Record<TransactionRelationType, string> = {
  [TransactionRelationType.RECEPTION_PACK]: 'Packs registrados',
  [TransactionRelationType.TRAY_RECEPTION]: 'Bandejas ingresadas',
  [TransactionRelationType.TRAY_DEVOLUTION]: 'Devoluciones de bandejas',
  [TransactionRelationType.PALLET_ASSIGNMENT]: 'Asignaciones a pallets',
  [TransactionRelationType.TRAY_ADJUSTMENT]: 'Ajustes de bandejas',
  [TransactionRelationType.PALLET_RELEASE]: 'Liberaciones de pallets',
  [TransactionRelationType.ADVANCE_TO_SETTLEMENT]: 'Aplicaciones de anticipos',
  [TransactionRelationType.RECEPTION_TO_SETTLEMENT]: 'Liquidaciones vinculadas',
};

const RELATION_TYPES_FOR_GROUPS: TransactionRelationType[] = [
  TransactionRelationType.TRAY_RECEPTION,
  TransactionRelationType.TRAY_DEVOLUTION,
  TransactionRelationType.PALLET_ASSIGNMENT,
  TransactionRelationType.TRAY_ADJUSTMENT,
  TransactionRelationType.PALLET_RELEASE,
];

const parseUnknownMetadata = (value: unknown): Record<string, any> | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('[getReceptionDetail] No se pudo parsear metadata de relación:', error);
      return null;
    }
  }
  return typeof value === 'object' ? (value as Record<string, any>) : null;
};

const normalizeAssignments = (value: unknown): Array<{ palletId: number; traysAssigned: number; }> => {
  if (!value) {
    return [];
  }

  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch (error) {
      console.warn('[getReceptionDetail] No se pudo parsear palletAssignments:', error);
      parsed = [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((assignment: any) => {
      if (!assignment) {
        return null;
      }
      const palletIdRaw = assignment.palletId;
      const palletId = typeof palletIdRaw === 'number' ? palletIdRaw : Number(palletIdRaw);
      if (!Number.isFinite(palletId)) {
        return null;
      }
      return {
        palletId,
        traysAssigned: normalizeNumber(assignment.traysAssigned, 0),
      };
    })
    .filter((assignment): assignment is { palletId: number; traysAssigned: number } => Boolean(assignment));
};

export async function getReceptionDetail(receptionId: string): Promise<ReceptionDetailResponse> {
  if (!receptionId) {
    return { success: false, error: 'Debes proporcionar un ID de recepción válido.' };
  }

  try {
    const dataSource = await getDb();

    const reception = await dataSource.getRepository(Transaction).findOne({
      where: {
        id: receptionId as unknown as any,
        type: TransactionType.RECEPTION,
        deletedAt: IsNull(),
      },
      relations: {
        producer: { person: true, productiveUnit: true },
        user: { person: true },
        season: true,
      },
    });

    if (!reception) {
      return { success: false, error: 'La recepción no existe o fue eliminada.' };
    }

    const metadata = (toReceptionMetadata(reception.metadata) ?? {}) as Record<string, any>;
    const totalsRaw = metadata?.totals ?? null;
    const metadataPacks = Array.isArray(metadata?.packs) ? metadata.packs : [];

    const packRepository = dataSource.getRepository(ReceptionPack);
    const packEntities = await packRepository.find({
      where: { receptionTransactionId: String(reception.id) },
      order: { id: 'ASC' },
    });

    const metadataPackById = new Map<string, any>();
    metadataPacks.forEach((pack: any) => {
      if (pack && pack.packId !== undefined && pack.packId !== null) {
        metadataPackById.set(String(pack.packId), pack);
      }
    });

    const packs: ReceptionDetailPack[] = packEntities.map((entity) => {
      const packId = String(entity.id);
      const meta = metadataPackById.get(packId) ?? null;

      const packNumberRaw = meta?.packNumber;
      const packNumber = typeof packNumberRaw === 'number'
        ? packNumberRaw
        : typeof packNumberRaw === 'string'
          ? Number(packNumberRaw)
          : null;

      return {
        packId,
        packNumber: Number.isFinite(packNumber) ? Number(packNumber) : null,
        varietyName: entity.varietyName || meta?.varietyName || null,
        formatName: entity.formatName || meta?.formatName || null,
        trayLabel: entity.trayLabel || meta?.trayLabel || null,
        trayId: entity.trayId || (meta?.trayId ? String(meta.trayId) : null),
        traysQuantity: normalizeNumber(entity.traysQuantity, 0),
        unitTrayWeightKg: normalizeNumber(entity.unitTrayWeight, 0),
        traysTotalWeightKg: normalizeNumber(entity.traysTotalWeight, 0),
        grossWeightKg: normalizeNumber(entity.grossWeight, 0),
        netWeightBeforeImpuritiesKg: normalizeNumber(entity.netWeightBeforeImpurities, 0),
        netWeightKg: normalizeNumber(entity.netWeight, 0),
        impurityPercent: normalizeNumber(entity.impurityPercent, 0),
        pricePerKg: normalizeNumber(entity.pricePerKg, 0),
        totalToPay: normalizeNumber(entity.totalToPay, 0),
        currency: entity.currency,
        palletAssignments: normalizeAssignments(entity.palletAssignments),
      };
    });

    metadataPacks.forEach((pack: any, index: number) => {
      if (!pack) {
        return;
      }
      const packId = pack.packId !== undefined && pack.packId !== null
        ? String(pack.packId)
        : `meta-${index}`;
      const exists = packs.some((entry) => entry.packId === packId);
      if (exists) {
        return;
      }
      const packNumberRaw = pack.packNumber;
      const packNumber = typeof packNumberRaw === 'number'
        ? packNumberRaw
        : typeof packNumberRaw === 'string'
          ? Number(packNumberRaw)
          : null;
      packs.push({
        packId,
        packNumber: Number.isFinite(packNumber) ? Number(packNumber) : null,
        varietyName: pack.varietyName ?? null,
        formatName: pack.formatName ?? null,
        trayLabel: pack.trayLabel ?? null,
        trayId: pack.trayId ? String(pack.trayId) : null,
        traysQuantity: normalizeNumber(pack.traysQuantity, 0),
        unitTrayWeightKg: normalizeNumber(pack.unitTrayWeightKg ?? pack.unitTrayWeight, 0),
        traysTotalWeightKg: normalizeNumber(pack.traysTotalWeightKg ?? 0, 0),
        grossWeightKg: normalizeNumber(pack.grossWeightKg ?? 0, 0),
        netWeightBeforeImpuritiesKg: normalizeNumber(pack.netWeightBeforeImpuritiesKg ?? 0, 0),
        netWeightKg: normalizeNumber(pack.netWeightKg ?? 0, 0),
        impurityPercent: normalizeNumber(pack.impurityPercent ?? 0, 0),
        pricePerKg: normalizeNumber(pack.pricePerKg ?? 0, 0),
        totalToPay: normalizeNumber(pack.totalToPay ?? 0, 0),
        currency: typeof pack.currency === 'string' ? pack.currency : 'CLP',
        palletAssignments: normalizeAssignments(pack.palletAssignments),
      });
    });

    const relationRepository = dataSource.getRepository(TransactionRelation);
    const relations = await relationRepository.find({
      where: { parentTransactionId: String(reception.id) },
      relations: { childTransaction: true },
      order: { createdAt: 'ASC', id: 'ASC' },
    });

    const trayReturnsMap = new Map<string, ReceptionDetailTrayReturn>();
    const metadataTrayReturns = Array.isArray(metadata?.trayReturns) ? metadata.trayReturns : [];

    metadataTrayReturns.forEach((item: any, index: number) => {
      if (!item) {
        return;
      }
      const transactionId = item.transactionId ? String(item.transactionId) : null;
      const key = transactionId ?? `metadata-${index}`;
      trayReturnsMap.set(key, {
        transactionId,
        trayId: item.trayId ? String(item.trayId) : null,
        trayLabel: item.trayLabel ?? null,
        quantityReturned: normalizeNumber(item.quantityReturned, 0),
      });
    });

    const groupsMap = new Map<TransactionRelationType, ReceptionDetailRelatedMovementGroup>();
    RELATION_TYPES_FOR_GROUPS.forEach((relationType) => {
      groupsMap.set(relationType, {
        relationType: relationType as ReceptionRelationType,
        label: RELATION_TYPE_LABELS[relationType],
        items: [],
      });
    });

    relations.forEach((relation) => {
      const relationType = relation.relationType;
      const child = relation.childTransaction ?? null;

      if (relationType === TransactionRelationType.TRAY_DEVOLUTION && child) {
        const childMetadata = parseUnknownMetadata(child.metadata);
        const transactionId = relation.childTransactionId ? String(relation.childTransactionId) : null;
        const key = transactionId ?? `relation-${relation.id}`;
        const existing = trayReturnsMap.get(key);
        trayReturnsMap.set(key, {
          transactionId,
          trayId: childMetadata?.trayId ? String(childMetadata.trayId) : existing?.trayId ?? null,
          trayLabel: childMetadata?.trayLabel ?? existing?.trayLabel ?? null,
          quantityReturned: normalizeNumber(childMetadata?.quantityReturned ?? existing?.quantityReturned, 0) || 0,
        });
      }

      const group = groupsMap.get(relationType);
      if (group && child) {
        const childMetadata = parseUnknownMetadata(child.metadata);
        group.items.push({
          id: String(child.id),
          relationId: relation.id,
          relationType: relation.relationType as ReceptionRelationType,
          relationContext: relation.context ?? null,
          transactionType: child.type as unknown as ReceptionTransactionType,
          direction: child.direction as unknown as ReceptionTransactionDirection,
          unit: child.unit as unknown as ReceptionTransactionUnit,
          amount: normalizeNumber(child.amount, 0),
          metadata: childMetadata,
          createdAt: child.createdAt ? child.createdAt.toISOString() : undefined,
        });
      }
    });

    const trayReturns = Array.from(trayReturnsMap.values()).sort((a, b) => {
      if (!a.transactionId) {
        return 1;
      }
      if (!b.transactionId) {
        return -1;
      }
      return a.transactionId.localeCompare(b.transactionId);
    });

    const relatedMovements = Array.from(groupsMap.values()).map((group) => ({
      ...group,
      items: group.items.sort((a: ReceptionDetailRelatedMovement, b: ReceptionDetailRelatedMovement) => {
        if (!a.createdAt) {
          return 1;
        }
        if (!b.createdAt) {
          return -1;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }),
    }));

    const traysInPacks = packs.reduce((sum, pack) => sum + normalizeNumber(pack.traysQuantity, 0), 0);
    const grossWeightKg = packs.reduce((sum, pack) => sum + normalizeNumber(pack.grossWeightKg, 0), 0);
    const netWeightKg = packs.reduce((sum, pack) => sum + normalizeNumber(pack.netWeightKg, 0), 0);
    const trayWeightKg = packs.reduce((sum, pack) => sum + normalizeNumber(pack.traysTotalWeightKg, 0), 0);
    const payableCLP = packs
      .filter((pack) => (pack.currency || '').toUpperCase() === 'CLP')
      .reduce((sum, pack) => sum + normalizeNumber(pack.totalToPay, 0), 0);
    const payableUSD = packs
      .filter((pack) => (pack.currency || '').toUpperCase() === 'USD')
      .reduce((sum, pack) => sum + normalizeNumber(pack.totalToPay, 0), 0);
    const trayReturnsTotal = trayReturns.reduce((sum, item) => sum + normalizeNumber(item.quantityReturned, 0), 0);

    const totals: ReceptionDetailTotals = {
      packsCount: Math.max(0, normalizeNumber(totalsRaw?.packsCount, packs.length)),
      traysInPacks: normalizeNumber(totalsRaw?.traysInPacks, traysInPacks),
      trayReturns: normalizeNumber(totalsRaw?.trayReturns, trayReturnsTotal),
      grossWeightKg: normalizeNumber(totalsRaw?.grossWeightKg, grossWeightKg),
      netWeightKg: normalizeNumber(totalsRaw?.netWeightKg, netWeightKg),
      trayWeightKg: normalizeNumber(totalsRaw?.trayWeightKg, trayWeightKg),
      payableCLP: normalizeNumber(totalsRaw?.payableCLP, payableCLP),
      payableUSD: normalizeNumber(totalsRaw?.payableUSD, payableUSD),
      totalCLPToPay: normalizeNumber(
        totalsRaw?.totalCLPToPay ?? metadata?.totalCLPToPay,
        normalizeNumber(reception.amount, 0),
      ),
    };

    const producerInfo: ReceptionDetailProducerInfo | null = reception.producer
      ? {
          id: reception.producer.id,
          name: reception.producer.name,
          dni: reception.producer.dni,
          phone: reception.producer.phone ?? null,
          mail: reception.producer.mail ?? null,
          personName: reception.producer.person?.name ?? null,
          personDni: reception.producer.person?.dni ?? null,
          productiveUnitName: reception.producer.productiveUnit?.name ?? null,
          productiveUnitAddress: reception.producer.productiveUnit?.address ?? null,
        }
      : null;

    const varietyNames = new Set<string>();
    const formatNames = new Set<string>();
    const trayLabels = new Set<string>();

    packs.forEach((pack) => {
      if (pack.varietyName) {
        varietyNames.add(pack.varietyName);
      }
      if (pack.formatName) {
        formatNames.add(pack.formatName);
      }
      if (pack.trayLabel) {
        trayLabels.add(pack.trayLabel);
      } else if (pack.trayId) {
        trayLabels.add(pack.trayId);
      }
    });

    const historyEntries = Array.isArray(metadata?.changesHistory) ? metadata.changesHistory : [];
    const history: ReceptionDetailHistoryItem[] = historyEntries.map((entry: any) => ({
      changedAt: entry?.changedAt ? String(entry.changedAt) : undefined,
      changedBy: entry?.changedBy ? String(entry.changedBy) : undefined,
      changedByName: entry?.changedByName ?? undefined,
      summary: entry?.summary ?? undefined,
      details: Array.isArray(entry?.details)
        ? entry.details.map((detail: any) => ({
            field: detail?.field ?? undefined,
            previousValue: detail?.previousValue ?? undefined,
            newValue: detail?.newValue ?? undefined,
          }))
        : [],
    }));

    history.sort((a, b) => {
      if (!a.changedAt) {
        return 1;
      }
      if (!b.changedAt) {
        return -1;
      }
      return new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(); // Descendente: más reciente primero
    });

    const detail: ReceptionDetailData = {
      summary: {
        id: String(reception.id),
        guideNumber: metadata?.guideNumber ?? null,
        producerName: metadata?.producerName ?? reception.producer?.name ?? null,
        createdAt: reception.createdAt ? reception.createdAt.toISOString() : undefined,
        updatedAt: reception.updatedAt ? reception.updatedAt.toISOString() : undefined,
        createdById: reception.userId,
        createdByName: reception.user?.person?.name ?? reception.user?.userName ?? undefined,
        seasonId: reception.season?.id ?? null,
        seasonName: reception.season?.name ?? null,
        amount: normalizeNumber(reception.amount, 0),
        unit: reception.unit as unknown as ReceptionTransactionUnit,
        exchangeRate: metadata?.exchangeRate ?? null,
        totalCLPToPay: totals.totalCLPToPay,
        payableUSD: totals.payableUSD,
      },
      producer: producerInfo,
      documents: {
        guideNumber: metadata?.guideNumber ?? null,
        varietyNames: Array.from(varietyNames),
        formatNames: Array.from(formatNames),
        trayLabels: Array.from(trayLabels),
      },
      totals,
      packs,
      trayReturns,
      relatedMovements,
      history,
      metadataRaw: metadata,
    };

    return {
      success: true,
      data: detail,
    };
  } catch (error) {
    console.error('[getReceptionDetail] Error obteniendo detalle de recepción:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener el detalle de la recepción',
    };
  }
}

export async function deleteReception(receptionId: string, auditUserId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!receptionId) {
      return { success: false, error: 'ID de recepción inválido' };
    }

    let receptionIdBigInt: bigint;
    try {
      receptionIdBigInt = BigInt(receptionId);
    } catch (error) {
      return { success: false, error: 'ID de recepción inválido' };
    }

    const dataSource = await getDb();

    await dataSource.transaction(async (manager) => {
      const reception = await manager.getRepository(Transaction).findOne({
        where: { id: receptionIdBigInt, type: TransactionType.RECEPTION },
      });

      if (!reception) {
        throw new Error('La recepción no existe o ya fue eliminada');
      }

      const relationsRepo = manager.getRepository(TransactionRelation);
      const relations = await relationsRepo.find({
        where: { parentTransactionId: receptionId },
      });

      const childTransactionIds = relations
        .map((relation) => relation.childTransactionId)
        .filter((id): id is string => Boolean(id))
        .map((id) => {
          try {
            return BigInt(id);
          } catch (error) {
            return null;
          }
        })
        .filter((id): id is bigint => id !== null);

      if (childTransactionIds.length > 0) {
        await manager.getRepository(Transaction).softDelete({ id: In(childTransactionIds) });
      }

      const childReceptionPackIds = relations
        .map((relation) => relation.childReceptionPackId)
        .filter((id): id is number => typeof id === 'number');

      if (childReceptionPackIds.length > 0) {
        await manager.getRepository(ReceptionPack).delete({ id: In(childReceptionPackIds) });
      }

      if (relations.length > 0) {
        await relationsRepo.delete({ parentTransactionId: receptionId });
      }

      await manager.getRepository(ReceptionPack).delete({ receptionTransactionId: receptionId });

      // Auditoría de eliminación de recepción
      let userId = auditUserId;
      if (!userId) {
        try {
          const { userId: sessionUserId } = await getCurrentUserSession();
          userId = sessionUserId;
        } catch (error) {
          userId = undefined;
        }
      }
      const audit = manager.create(Audit, {
        entityName: 'Transaction',
        entityId: receptionId,
        userId: userId,
        action: AuditActionType.DELETE,
        description: `Eliminación de recepción` + (reception.metadata && typeof reception.metadata === 'object' && 'guide' in reception.metadata && reception.metadata.guide ? ` (guía: ${reception.metadata.guide})` : ''),
        oldValues: {
          amount: reception.amount,
          seasonId: reception.seasonId,
          producerId: reception.producerId,
          createdAt: reception.createdAt,
          metadata: reception.metadata,
        },
        changes: {
          fields: ['amount', 'seasonId', 'producerId', 'createdAt', 'metadata'],
          summary: 'Eliminación de recepción',
          changeCount: 1,
        },
        createdAt: new Date(),
      });
      await manager.save(Audit, audit);

      await manager.getRepository(Transaction).softDelete({ id: receptionIdBigInt });
    });

    revalidatePath('/home/receptions/receptions');

    return { success: true };
  } catch (error: any) {
    console.error('[deleteReception] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al eliminar la recepción',
    };
  }
}

export interface UpdateReceptionDateInput {
  receptionId: string;
  newDate: string; // ISO datetime string (date and time)
  reason: string;
  userId: string;
}

export interface UpdateReceptionDateResult {
  success: boolean;
  error?: string;
}

export async function updateReceptionDate(input: UpdateReceptionDateInput): Promise<UpdateReceptionDateResult> {
  try {
    const { receptionId, newDate, reason, userId } = input;

    // Validations
    if (!receptionId || !newDate || !reason || !userId) {
      return { success: false, error: 'Todos los campos son requeridos' };
    }

    const newDateObj = new Date(newDate);
    if (isNaN(newDateObj.getTime())) {
      return { success: false, error: 'Fecha inválida' };
    }

    // Prevent future dates
    const now = new Date();
    if (newDateObj > now) {
      return { success: false, error: 'La fecha no puede ser futura' };
    }

    // Prevent dates too old (more than 1 year ago)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (newDateObj < oneYearAgo) {
      return { success: false, error: 'No se pueden modificar recepciones con más de 1 año de antigüedad' };
    }

    const db = await getDb();
    const manager = db.manager;

    await manager.transaction(async (transactionManager) => {
      // Get current reception
      const reception = await transactionManager.getRepository(Transaction).findOne({
        where: { id: BigInt(receptionId) },
      });

      if (!reception) {
        throw new Error('Recepción no encontrada');
      }

      const oldDate = reception.createdAt;

      // Update the transaction date
      await transactionManager.getRepository(Transaction).update(
        { id: BigInt(receptionId) },
        {
          createdAt: newDateObj,
          updatedAt: new Date(),
        }
      );

      // Update metadata with change history
      const currentMetadata: Record<string, any> = (reception.metadata as Record<string, any>) || {};
      const changesHistory = Array.isArray(currentMetadata?.changesHistory) ? currentMetadata.changesHistory : [];
      changesHistory.push({
        changedAt: new Date().toISOString(),
        changedBy: userId,
        changedByName: null, // Will be populated by getReceptionDetail
        summary: `Fecha de recepción actualizada: ${formatAuditDate(oldDate?.toISOString() || '')} → ${formatAuditDate(newDate)}`,
        details: [
          {
            field: 'Fecha y hora de recepción',
            previousValue: oldDate?.toISOString() || '',
            newValue: newDate,
          },
        ],
      });

      await transactionManager.getRepository(Transaction).update(
        { id: BigInt(receptionId) },
        {
          metadata: {
            ...currentMetadata,
            changesHistory,
          } as any,
        }
      );

      // Create audit entry
      const audit = new Audit();
      audit.entityName = 'Transaction';
      audit.entityId = receptionId;
      audit.userId = userId;
      audit.action = 'UPDATE' as any;
      audit.changes = {
        createdAt: {
          old: oldDate?.toISOString(),
          new: newDateObj.toISOString(),
        },
      };
      audit.oldValues = { createdAt: oldDate?.toISOString() };
      audit.newValues = { createdAt: newDateObj.toISOString() };
      audit.description = `Actualización de fecha de recepción: ${reason}`;

      await transactionManager.getRepository(Audit).save(audit);
    });

    revalidatePath('/home/receptions/receptions');

    return { success: true };
  } catch (error: any) {
    console.error('[updateReceptionDate] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al actualizar la fecha de la recepción',
    };
  }
}

export interface UpdateReceptionExchangeRateInput {
  receptionId: string;
  newExchangeRate: number;
  reason: string;
  userId: string;
}

export interface UpdateReceptionExchangeRateResult {
  success: boolean;
  error?: string;
}

export async function updateReceptionExchangeRate(input: UpdateReceptionExchangeRateInput): Promise<UpdateReceptionExchangeRateResult> {
  try {
    const { receptionId, newExchangeRate, reason, userId } = input;

    if (!receptionId || !reason?.trim() || !userId) {
      return {
        success: false,
        error: 'Datos incompletos para actualizar el tipo de cambio',
      };
    }

    if (newExchangeRate < 0) {
      return {
        success: false,
        error: 'El tipo de cambio debe ser un valor positivo',
      };
    }

    const dataSource = await getDb();
    const manager = dataSource.manager;

    await manager.transaction(async (transactionManager) => {
      // Obtener la recepción actual
      const reception = await transactionManager.findOne(Transaction, {
        where: { id: BigInt(receptionId) },
        select: ['id', 'metadata', 'createdAt', 'updatedAt'],
      });

      if (!reception) {
        throw new Error('Recepción no encontrada');
      }

      const oldMetadata = toReceptionMetadata(reception.metadata) || {};
      const oldExchangeRate = oldMetadata.exchangeRate || 0;
      const oldTotalCLPToPay = oldMetadata.totalCLPToPay || reception.amount || 0;

      // Obtener los valores actuales de payableCLP y payableUSD
      const payableCLP = oldMetadata.totals?.payableCLP || 0;
      const payableUSD = oldMetadata.totals?.payableUSD || 0;

      // Calcular el nuevo totalCLPToPay con el nuevo exchange rate
      const newTotalCLPToPay = normalizeNumber(payableCLP + (payableUSD * newExchangeRate), 0);

      // Preparar el changesHistory
      const changesHistory = Array.isArray(oldMetadata?.changesHistory) ? oldMetadata.changesHistory : [];
      changesHistory.push({
        changedAt: new Date().toISOString(),
        changedBy: userId,
        changedByName: null, // Will be populated by getReceptionDetail
        summary: `Tipo de cambio actualizado: ${oldExchangeRate} → ${newExchangeRate} (Total CLP: ${oldTotalCLPToPay} → ${newTotalCLPToPay})`,
        details: [
          {
            field: 'Tipo de cambio (CLP/USD)',
            previousValue: oldExchangeRate,
            newValue: newExchangeRate,
          },
          {
            field: 'Total a pagar (CLP)',
            previousValue: oldTotalCLPToPay,
            newValue: newTotalCLPToPay,
          },
        ],
      });

      // Actualizar el metadata con el nuevo exchangeRate, totalCLPToPay recalculado y changesHistory
      const newMetadata = {
        ...oldMetadata,
        exchangeRate: newExchangeRate,
        totalCLPToPay: newTotalCLPToPay,
        totals: {
          ...oldMetadata.totals,
          totalCLPToPay: newTotalCLPToPay,
        },
        changesHistory,
      };

      // Actualizar la recepción (metadata y amount)
      await transactionManager.getRepository(Transaction).update(
        { id: BigInt(receptionId) },
        {
          metadata: newMetadata as any,
          amount: Number(newTotalCLPToPay.toFixed(2)),
          updatedAt: new Date(),
        }
      );

      // Registrar en auditoría
      const audit = new Audit();
      audit.entityName = 'Transaction';
      audit.entityId = receptionId;
      audit.userId = userId;
      audit.action = 'UPDATE' as any;
      audit.changes = {
        exchangeRate: {
          old: oldExchangeRate,
          new: newExchangeRate,
        },
        totalCLPToPay: {
          old: oldTotalCLPToPay,
          new: newTotalCLPToPay,
        },
      };
      audit.oldValues = { exchangeRate: oldExchangeRate, totalCLPToPay: oldTotalCLPToPay };
      audit.newValues = { exchangeRate: newExchangeRate, totalCLPToPay: newTotalCLPToPay };
      audit.description = `Actualización de tipo de cambio de recepción: ${reason.trim()}`;

      await transactionManager.getRepository(Audit).save(audit);

      // Log de la actualización
      console.log(`[updateReceptionExchangeRate] Exchange rate updated for reception ${receptionId}: ${oldExchangeRate} → ${newExchangeRate}, totalCLPToPay: ${oldTotalCLPToPay} → ${newTotalCLPToPay}`);
    });

    // Revalidar la página
    revalidatePath('/home/receptions/receptions');

    return { success: true };
  } catch (error: any) {
    console.error('[updateReceptionExchangeRate] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al actualizar el tipo de cambio de la recepción',
    };
  }
}

export interface UpdatePackImpurityInput {
  receptionId: string;
  packId: string;
  newImpurityPercent: number;
  reason: string;
  userId: string;
}

export interface UpdatePackImpurityResult {
  success: boolean;
  error?: string;
}

export async function updatePackImpurity(input: UpdatePackImpurityInput): Promise<UpdatePackImpurityResult> {
  try {
    const { receptionId, packId, newImpurityPercent, reason, userId } = input;

    // Validations
    if (!receptionId || !packId || !reason?.trim() || !userId) {
      return { success: false, error: 'Todos los campos son requeridos' };
    }

    if (newImpurityPercent < 0 || newImpurityPercent > 100) {
      return { success: false, error: 'El porcentaje de impureza debe estar entre 0 y 100' };
    }

    const dataSource = await getDb();
    const manager = dataSource.manager;

    await manager.transaction(async (transactionManager) => {
      // Get reception
      const reception = await transactionManager.getRepository(Transaction).findOne({
        where: { id: BigInt(receptionId), type: TransactionType.RECEPTION },
        select: ['id', 'metadata', 'amount', 'createdAt', 'updatedAt'],
      });

      if (!reception) {
        throw new Error('Recepción no encontrada');
      }

      // Get pack
      const pack = await transactionManager.getRepository(ReceptionPack).findOne({
        where: { id: Number(packId), receptionTransactionId: String(reception.id) },
      });

      if (!pack) {
        throw new Error('Pack no encontrado en esta recepción');
      }

      const oldMetadata = toReceptionMetadata(reception.metadata) || {};
      const metadataPacks = Array.isArray(oldMetadata.packs) ? oldMetadata.packs : [];
      const packMetadataIndex = metadataPacks.findIndex((p: any) => String(p.packId) === String(pack.id));

      // Get current values
      const oldImpurityPercent = normalizeNumber(pack.impurityPercent, 0);
      const netWeightBeforeImpurities = normalizeNumber(pack.netWeightBeforeImpurities, 0);
      const pricePerKg = normalizeNumber(pack.pricePerKg, 0);
      const packCurrency = String(pack.currency || 'CLP').toUpperCase();

      // Calculate new values
      const newNetWeight = normalizeNumber(netWeightBeforeImpurities * (1 - newImpurityPercent / 100), 0);
      const newTotalToPay = normalizeNumber(newNetWeight * pricePerKg, 0);

      // Update pack in database
      await transactionManager.getRepository(ReceptionPack).update(
        { id: pack.id },
        {
          impurityPercent: newImpurityPercent,
          netWeight: newNetWeight,
          totalToPay: newTotalToPay,
        }
      );

      // Update pack metadata
      if (packMetadataIndex >= 0) {
        metadataPacks[packMetadataIndex] = {
          ...metadataPacks[packMetadataIndex],
          impurityPercent: newImpurityPercent,
          netWeightKg: newNetWeight,
          totalToPay: newTotalToPay,
        };
      }

      // Recalculate reception totals
      const updatedPacks = metadataPacks.map((p: any) => ({
        netWeightKg: normalizeNumber(p.netWeightKg, 0),
        totalToPay: normalizeNumber(p.totalToPay, 0),
        currency: String(p.currency || 'CLP').toUpperCase(),
      }));

      const newNetWeightTotal = updatedPacks.reduce((sum: number, p: any) => sum + p.netWeightKg, 0);
      const newPayableCLP = updatedPacks
        .filter((p: any) => p.currency === 'CLP')
        .reduce((sum: number, p: any) => sum + p.totalToPay, 0);
      const newPayableUSD = updatedPacks
        .filter((p: any) => p.currency === 'USD')
        .reduce((sum: number, p: any) => sum + p.totalToPay, 0);

      const exchangeRate = normalizeNumber(oldMetadata.exchangeRate, 0);
      const newTotalCLPToPay = normalizeNumber(newPayableCLP + (newPayableUSD * exchangeRate), 0);

      // Update totals in metadata
      const newTotals = {
        ...oldMetadata.totals,
        netWeightKg: newNetWeightTotal,
        payableCLP: newPayableCLP,
        payableUSD: newPayableUSD,
        totalCLPToPay: newTotalCLPToPay,
      };

      // Add to change history
      const changesHistory = Array.isArray(oldMetadata.changesHistory) ? oldMetadata.changesHistory : [];
      changesHistory.push({
        changedAt: new Date().toISOString(),
        changedBy: userId,
        changedByName: null,
        summary: `Impureza del pack ${packMetadataIndex >= 0 ? metadataPacks[packMetadataIndex].packNumber || pack.id : pack.id} actualizada: ${oldImpurityPercent}% → ${newImpurityPercent}%`,
        details: [
          {
            field: 'Porcentaje de impureza',
            previousValue: oldImpurityPercent,
            newValue: newImpurityPercent,
          },
          {
            field: 'Peso neto (kg)',
            previousValue: normalizeNumber(pack.netWeight, 0),
            newValue: newNetWeight,
          },
          {
            field: 'Total a pagar',
            previousValue: normalizeNumber(pack.totalToPay, 0),
            newValue: newTotalToPay,
          },
          {
            field: 'Total recepción (CLP)',
            previousValue: normalizeNumber(oldMetadata.totalCLPToPay || reception.amount, 0),
            newValue: newTotalCLPToPay,
          },
        ],
      });

      // Update reception metadata and amount
      const newMetadata = {
        ...oldMetadata,
        packs: metadataPacks,
        totals: newTotals,
        totalCLPToPay: newTotalCLPToPay,
        changesHistory,
      };

      await transactionManager.getRepository(Transaction).update(
        { id: reception.id },
        {
          metadata: newMetadata as any,
          amount: Number(newTotalCLPToPay.toFixed(2)),
          updatedAt: new Date(),
        }
      );

      // Create audit entry
      const audit = new Audit();
      audit.entityName = 'ReceptionPack';
      audit.entityId = String(pack.id);
      audit.userId = userId;
      audit.action = 'UPDATE' as any;
      audit.changes = {
        impurityPercent: { old: oldImpurityPercent, new: newImpurityPercent },
        netWeight: { old: normalizeNumber(pack.netWeight, 0), new: newNetWeight },
        totalToPay: { old: normalizeNumber(pack.totalToPay, 0), new: newTotalToPay },
      };
      audit.oldValues = {
        impurityPercent: oldImpurityPercent,
        netWeight: normalizeNumber(pack.netWeight, 0),
        totalToPay: normalizeNumber(pack.totalToPay, 0),
      };
      audit.newValues = {
        impurityPercent: newImpurityPercent,
        netWeight: newNetWeight,
        totalToPay: newTotalToPay,
      };
      audit.description = `Actualización de impureza del pack: ${reason.trim()}`;

      await transactionManager.getRepository(Audit).save(audit);

      console.log(`[updatePackImpurity] Pack ${pack.id} impurity updated: ${oldImpurityPercent}% → ${newImpurityPercent}%, netWeight: ${pack.netWeight} → ${newNetWeight}, totalToPay: ${pack.totalToPay} → ${newTotalToPay}`);
    });

    revalidatePath('/home/receptions/receptions');

    return { success: true };
  } catch (error: any) {
    console.error('[updatePackImpurity] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al actualizar la impureza del pack',
    };
  }
}

export interface UpdatePackPriceInput {
  receptionId: string;
  packId: string;
  newPricePerKg: number;
  newCurrency: string;
  reason: string;
  userId: string;
}

export interface UpdatePackPriceResult {
  success: boolean;
  error?: string;
}

export async function updatePackPrice(input: UpdatePackPriceInput): Promise<UpdatePackPriceResult> {
  try {
    const { receptionId, packId, newPricePerKg, newCurrency, reason, userId } = input;

    // Validations
    if (!receptionId || !packId || !reason?.trim() || !userId) {
      return { success: false, error: 'Todos los campos son requeridos' };
    }

    if (newPricePerKg < 0) {
      return { success: false, error: 'El precio por kg debe ser mayor o igual a 0' };
    }

    if (!['CLP', 'USD'].includes(newCurrency)) {
      return { success: false, error: 'La moneda debe ser CLP o USD' };
    }

    const currencyEnum = newCurrency as Currency;

    const dataSource = await getDb();
    const manager = dataSource.manager;

    await manager.transaction(async (transactionManager) => {
      // Get reception
      const reception = await transactionManager.getRepository(Transaction).findOne({
        where: { id: BigInt(receptionId), type: TransactionType.RECEPTION },
        select: ['id', 'metadata', 'amount', 'createdAt', 'updatedAt'],
      });

      if (!reception) {
        throw new Error('Recepción no encontrada');
      }

      // Get pack
      const pack = await transactionManager.getRepository(ReceptionPack).findOne({
        where: { id: Number(packId), receptionTransactionId: String(reception.id) },
      });

      if (!pack) {
        throw new Error('Pack no encontrado en esta recepción');
      }

      const oldMetadata = toReceptionMetadata(reception.metadata) || {};
      const metadataPacks = Array.isArray(oldMetadata.packs) ? oldMetadata.packs : [];
      const packMetadataIndex = metadataPacks.findIndex((p: any) => String(p.packId) === String(pack.id));

      // Get current values
      const oldPricePerKg = normalizeNumber(pack.pricePerKg, 0);
      const oldCurrency = String(pack.currency || 'CLP').toUpperCase();
      const netWeight = normalizeNumber(pack.netWeight, 0);
      const packCurrency = String(pack.currency || 'CLP').toUpperCase();

      // Calculate new values
      const newTotalToPay = normalizeNumber(netWeight * newPricePerKg, 0);

      // Update pack in database
      await transactionManager.getRepository(ReceptionPack).update(
        { id: pack.id },
        {
          pricePerKg: newPricePerKg,
          currency: currencyEnum,
          totalToPay: newTotalToPay,
        }
      );

      // Update pack metadata
      if (packMetadataIndex >= 0) {
        metadataPacks[packMetadataIndex] = {
          ...metadataPacks[packMetadataIndex],
          pricePerKg: newPricePerKg,
          currency: newCurrency,
          totalToPay: newTotalToPay,
        };
      }

      // Recalculate reception totals
      const updatedPacks = metadataPacks.map((p: any) => ({
        netWeightKg: normalizeNumber(p.netWeightKg, 0),
        totalToPay: normalizeNumber(p.totalToPay, 0),
        currency: String(p.currency || 'CLP').toUpperCase(),
      }));

      const newPayableCLP = updatedPacks
        .filter((p: any) => p.currency === 'CLP')
        .reduce((sum: number, p: any) => sum + p.totalToPay, 0);
      const newPayableUSD = updatedPacks
        .filter((p: any) => p.currency === 'USD')
        .reduce((sum: number, p: any) => sum + p.totalToPay, 0);

      const exchangeRate = normalizeNumber(oldMetadata.exchangeRate, 0);
      const newTotalCLPToPay = normalizeNumber(newPayableCLP + (newPayableUSD * exchangeRate), 0);

      // Update totals in metadata
      const newTotals = {
        ...oldMetadata.totals,
        payableCLP: newPayableCLP,
        payableUSD: newPayableUSD,
        totalCLPToPay: newTotalCLPToPay,
      };

      // Add to change history
      const changesHistory = Array.isArray(oldMetadata.changesHistory) ? oldMetadata.changesHistory : [];
      changesHistory.push({
        changedAt: new Date().toISOString(),
        changedBy: userId,
        changedByName: null,
        summary: `Precio del pack ${packMetadataIndex >= 0 ? metadataPacks[packMetadataIndex].packNumber || pack.id : pack.id} actualizado: ${oldPricePerKg} → ${newPricePerKg} ${newCurrency}/kg`,
        details: [
          {
            field: 'Precio por kg',
            previousValue: oldPricePerKg,
            newValue: newPricePerKg,
          },
          {
            field: 'Moneda',
            previousValue: oldCurrency,
            newValue: newCurrency,
          },
          {
            field: 'Total a pagar',
            previousValue: normalizeNumber(pack.totalToPay, 0),
            newValue: newTotalToPay,
          },
          {
            field: 'Total recepción (CLP)',
            previousValue: normalizeNumber(oldMetadata.totalCLPToPay || reception.amount, 0),
            newValue: newTotalCLPToPay,
          },
        ],
      });

      // Update reception metadata and amount
      const newMetadata = {
        ...oldMetadata,
        packs: metadataPacks,
        totals: newTotals,
        totalCLPToPay: newTotalCLPToPay,
        changesHistory,
      };

      await transactionManager.getRepository(Transaction).update(
        { id: reception.id },
        {
          metadata: newMetadata as any,
          amount: Number(newTotalCLPToPay.toFixed(2)),
          updatedAt: new Date(),
        }
      );

      // Create audit entry
      const audit = new Audit();
      audit.entityName = 'ReceptionPack';
      audit.entityId = String(pack.id);
      audit.userId = userId;
      audit.action = 'UPDATE' as any;
      audit.changes = {
        pricePerKg: { old: oldPricePerKg, new: newPricePerKg },
        currency: { old: oldCurrency, new: newCurrency },
        totalToPay: { old: normalizeNumber(pack.totalToPay, 0), new: newTotalToPay },
      };
      audit.oldValues = {
        pricePerKg: oldPricePerKg,
        currency: oldCurrency,
        totalToPay: normalizeNumber(pack.totalToPay, 0),
      };
      audit.newValues = {
        pricePerKg: newPricePerKg,
        currency: newCurrency,
        totalToPay: newTotalToPay,
      };
      audit.description = `Actualización de precio del pack: ${reason.trim()}`;

      await transactionManager.getRepository(Audit).save(audit);

      console.log(`[updatePackPrice] Pack ${pack.id} price updated: ${oldPricePerKg} ${oldCurrency} → ${newPricePerKg} ${newCurrency}/kg, totalToPay: ${pack.totalToPay} → ${newTotalToPay}`);
    });

    revalidatePath('/home/receptions/receptions');

    return { success: true };
  } catch (error: any) {
    console.error('[updatePackPrice] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al actualizar el precio del pack',
    };
  }
}
