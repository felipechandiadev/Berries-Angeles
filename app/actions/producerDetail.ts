'use server';

import { getDb } from '@/data/db';
import { Producer } from '@/data/entities/Producer';
import {
  Transaction,
  TransactionType,
  TransactionDirection,
  type SettlementMetadata,
} from '@/data/entities/Transaction';
import { Tray } from '@/data/entities/Tray';
import { In } from 'typeorm';
import type { ProducerDetailData } from '@/app/home/productiveManagement/producers/[id]/ui/producer-detail.types';
import { mapReceptionSettlementStatus } from '@/app/actions/receptions';
import { receptionDisplayStatusFromSources } from '@/lib/receptionDisplayStatus';
import { normalizePaymentStatus } from '@/lib/receptionPayment';

export async function getProducerDetailData(
  producerId: string,
): Promise<{ success: boolean; data?: ProducerDetailData; error?: string }> {
  try {
    if (!producerId?.trim()) {
      return { success: false, error: 'ID de productor inválido' };
    }

    const db = await getDb();

    const producer = await db.getRepository(Producer).findOne({
      where: { id: producerId },
      relations: ['person'],
    });

    if (!producer) {
      return { success: false, error: 'Productor no encontrado' };
    }

    const receptions = await db.getRepository(Transaction).find({
      where: {
        producerId,
        type: TransactionType.RECEPTION,
      },
      order: { createdAt: 'DESC' },
    });

    const advances = await db.getRepository(Transaction).find({
      where: {
        producerId,
        type: TransactionType.ADVANCE,
      },
      order: { createdAt: 'DESC' },
    });

    const settlements = await db.getRepository(Transaction).find({
      where: {
        producerId,
        type: TransactionType.SETTLEMENT,
      },
      order: { createdAt: 'DESC' },
    });

    const settledAdvanceIds = new Set<string>();
    settlements.forEach((settlement) => {
      const metadata = settlement.metadata as SettlementMetadata | undefined;
      if (metadata?.status === 'BORRADOR') return;
      if (Array.isArray(metadata?.advanceApplications)) {
        metadata.advanceApplications.forEach((app) => {
          if (app?.transactionId) settledAdvanceIds.add(String(app.transactionId));
        });
      }
    });

    const receptionSettlementStatusMap = await mapReceptionSettlementStatus(
      receptions.map((reception) => String(reception.id)),
      db.manager,
    );

    const trayMovements = await db
      .getRepository(Transaction)
      .createQueryBuilder('transaction')
      .where('transaction.producerId = :producerId', { producerId })
      .andWhere('transaction.type LIKE :type', { type: 'TRAY_%' })
      .orderBy('transaction.createdAt', 'DESC')
      .getMany();

    const trayIds = Array.from(
      new Set(
        trayMovements
          .map((transaction) => {
            const metadata = transaction.metadata as Record<string, unknown> | undefined;
            return metadata && typeof metadata.trayId === 'string' ? metadata.trayId : undefined;
          })
          .filter((value): value is string => Boolean(value)),
      ),
    );

    let trayNameLookup = new Map<string, string>();
    if (trayIds.length > 0) {
      const trays = await db.getRepository(Tray).find({
        where: { id: In(trayIds) },
        withDeleted: true,
      });
      trayNameLookup = new Map(trays.map((tray) => [tray.id, tray.name]));
    }

    const balanceByKey = new Map<string, { name: string; total: number }>();

    for (const transaction of trayMovements) {
      if (!transaction.metadata || typeof transaction.metadata !== 'object') {
        continue;
      }

      const metadata = transaction.metadata as unknown as Record<string, unknown>;
      const rawQuantity =
        metadata.quantity ??
        metadata.quantityReturned ??
        metadata.quantityDelivered ??
        metadata.amount ??
        transaction.amount;
      const quantity = Number(rawQuantity) || 0;

      const trayId = typeof metadata.trayId === 'string' ? metadata.trayId : undefined;
      const metadataLabel =
        typeof metadata.trayLabel === 'string' ? metadata.trayLabel.trim() : undefined;
      const resolvedName =
        metadataLabel || (trayId ? trayNameLookup.get(trayId) : undefined) || 'Desconocido';

      if (!metadata.trayLabel || metadata.trayLabel === '—') {
        metadata.trayLabel = resolvedName;
      }

      if (quantity === 0) {
        continue;
      }

      const balanceKey = trayId || metadataLabel || resolvedName;

      if (!balanceByKey.has(balanceKey)) {
        balanceByKey.set(balanceKey, { name: resolvedName, total: 0 });
      }

      const entry = balanceByKey.get(balanceKey)!;
      if (entry.name === 'Desconocido' && resolvedName !== 'Desconocido') {
        entry.name = resolvedName;
      }

      switch (transaction.type) {
        case TransactionType.TRAY_OUT_TO_PRODUCER:
        case TransactionType.TRAY_DELIVERY_TO_PRODUCER:
          entry.total += quantity;
          break;
        case TransactionType.TRAY_IN_FROM_PRODUCER:
        case TransactionType.TRAY_RECEPTION_FROM_PRODUCER:
          entry.total -= quantity;
          break;
        default:
          if (transaction.direction === TransactionDirection.OUT) {
            entry.total += quantity;
          } else if (transaction.direction === TransactionDirection.IN) {
            entry.total -= quantity;
          }
          break;
      }
    }

    const balance: Record<string, number> = {};
    balanceByKey.forEach(({ name, total }) => {
      const label = name || 'Desconocido';
      balance[label] = (balance[label] || 0) + total;
    });

    const processedReceptions = receptions.map((reception) => {
      const metadata = reception.metadata as Record<string, any> | undefined;

      let variety = 'N/A';
      let formatName = 'N/A';
      let price = 0;
      let netWeight = 0;

      if (metadata?.packs && Array.isArray(metadata.packs) && metadata.packs.length > 0) {
        const firstPack = metadata.packs[0];
        variety = firstPack.varietyName || 'N/A';
        formatName = firstPack.formatName || 'N/A';
        price = Number(firstPack.pricePerKg) || 0;
        netWeight = metadata.packs.reduce(
          (sum: number, p: any) => sum + (Number(p.netWeightKg ?? p.netWeight) || 0),
          0,
        );

        if (metadata.packs.length > 1) {
          const varieties = [
            ...new Set(metadata.packs.map((p: any) => p.varietyName).filter(Boolean)),
          ];
          const formats = [
            ...new Set(metadata.packs.map((p: any) => p.formatName).filter(Boolean)),
          ];

          if (varieties.length > 1) variety = `${varieties.length} variedades`;
          if (formats.length > 1) formatName = `${formats.length} formatos`;

          const prices = metadata.packs
            .map((p: any) => Number(p.pricePerKg) || 0)
            .filter((p: number) => p > 0);
          if (prices.length > 0) {
            price = prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length;
          }
        }
      } else if (metadata?.totals?.netWeightKg != null) {
        netWeight = Number(metadata.totals.netWeightKg) || 0;
      }

      return {
        ...reception,
        id: String(reception.id),
        variety,
        formatName,
        price,
        netWeight,
        status: receptionDisplayStatusFromSources(
          normalizePaymentStatus(metadata?.paymentStatus),
          receptionSettlementStatusMap.get(String(reception.id)) ?? 'NONE',
        ).label,
      };
    });

    const processedAdvances = advances.map((advance) => ({
      ...advance,
      id: String(advance.id),
      status: settledAdvanceIds.has(String(advance.id)) ? 'Liquidado' : 'Pendiente',
    }));

    const processedSettlements = settlements.map((settlement) => ({
      ...settlement,
      id: String(settlement.id),
    }));

    const processedTrayMovements = trayMovements.map((movement) => ({
      ...movement,
      id: String(movement.id),
    }));

    const serializedData = JSON.parse(
      JSON.stringify({
        producer: {
          ...producer,
          phone: typeof producer.phone === 'string' ? producer.phone : undefined,
          mail: typeof producer.mail === 'string' ? producer.mail : undefined,
          person: producer.person
            ? {
                ...producer.person,
                phone: typeof producer.person.phone === 'string' ? producer.person.phone : undefined,
                mail: typeof producer.person.mail === 'string' ? producer.person.mail : undefined,
              }
            : undefined,
        },
        receptions: processedReceptions,
        advances: processedAdvances,
        settlements: processedSettlements,
        trays: {
          balance,
          movements: processedTrayMovements,
        },
      }),
    ) as ProducerDetailData;

    return {
      success: true,
      data: serializedData,
    };
  } catch (error: any) {
    console.error('[getProducerDetailData] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al obtener detalles del productor',
    };
  }
}
