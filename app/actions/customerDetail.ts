'use server';

import { getDb } from '@/data/db';
import { Customer } from '@/data/entities/Customer';
import {
  Transaction,
  TransactionType,
  TransactionDirection,
  type DispatchMetadata,
} from '@/data/entities/Transaction';
import { Tray } from '@/data/entities/Tray';
import { In, IsNull } from 'typeorm';
import type { CustomerDetailData } from '@/app/home/dispatch/customers/ui/customer-detail.types';

export async function getCustomerDetailData(
  customerId: string,
): Promise<{ success: boolean; data?: CustomerDetailData; error?: string }> {
  try {
    if (!customerId?.trim()) {
      return { success: false, error: 'ID de cliente inválido' };
    }

    const db = await getDb();

    const customer = await db.getRepository(Customer).findOne({
      where: { id: customerId, deletedAt: IsNull() },
      relations: ['person'],
    });

    if (!customer) {
      return { success: false, error: 'Cliente no encontrado' };
    }

    const dispatches = await db
      .getRepository(Transaction)
      .createQueryBuilder('tx')
      .where('tx.type = :type', { type: TransactionType.DISPATCH })
      .andWhere('tx.deletedAt IS NULL')
      .andWhere(
        '(tx.clientId = :customerId OR JSON_UNQUOTE(JSON_EXTRACT(tx.metadata, \'$.customerId\')) = :customerId)',
        { customerId },
      )
      .orderBy('tx.createdAt', 'DESC')
      .getMany();

    const trayMovements = await db
      .getRepository(Transaction)
      .createQueryBuilder('transaction')
      .where('transaction.clientId = :customerId', { customerId })
      .andWhere('transaction.type LIKE :type', { type: 'TRAY_%' })
      .andWhere('transaction.deletedAt IS NULL')
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
        case TransactionType.TRAY_OUT_TO_CLIENT:
        case TransactionType.TRAY_DELIVERY_TO_CLIENT:
          entry.total += quantity;
          break;
        case TransactionType.TRAY_IN_FROM_CLIENT:
        case TransactionType.TRAY_RECEPTION_FROM_CLIENT:
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

    const person = customer.person;
    const name = person?.name?.trim() || 'Cliente';
    const dni = person?.dni?.trim() || '';
    const phone = typeof person?.phone === 'string' ? person.phone : undefined;
    const mail = typeof person?.mail === 'string' ? person.mail : undefined;

    const processedDispatches = dispatches.map((tx) => {
      const meta = (tx.metadata || {}) as DispatchMetadata;
      return {
        id: String(tx.id),
        createdAt: tx.createdAt,
        trayName: meta.trayName?.trim() || '—',
        fruitKgTotal: Number(meta.fruitKgTotal) || 0,
        traysTotal: Number(meta.traysTotal) || 0,
        palletsCount: Number(meta.palletsCount) || 0,
        saleTotalCLP: Number(meta.saleTotalCLP) || 0,
        pricePerKgCLP: Number(meta.pricePerKgCLP) || 0,
      };
    });

    const processedTrayMovements = trayMovements.map((movement) => ({
      ...movement,
      id: String(movement.id),
    }));

    const serializedData = JSON.parse(
      JSON.stringify({
        customer: {
          id: customer.id,
          personId: customer.personId,
          name,
          dni,
          phone,
          mail,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          person: person
            ? {
                id: person.id,
                name: person.name,
                dni: person.dni,
                phone: typeof person.phone === 'string' ? person.phone : undefined,
                mail: typeof person.mail === 'string' ? person.mail : undefined,
                bankAccounts: person.bankAccounts ?? null,
              }
            : undefined,
        },
        dispatches: processedDispatches,
        trays: {
          balance,
          movements: processedTrayMovements,
        },
      }),
    ) as CustomerDetailData;

    return {
      success: true,
      data: serializedData,
    };
  } catch (error: any) {
    console.error('[getCustomerDetailData] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al obtener detalles del cliente',
    };
  }
}
