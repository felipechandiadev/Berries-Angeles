// Server Actions para CRUD de la entidad Variety + precios por calidad
'use server';

import {
  Variety,
  Currency,
  type VarietyQualityPrice,
} from '../../data/entities/Variety';
import {
  VarietyPriceHistory,
  VarietyPriceHistorySource,
} from '../../data/entities/VarietyPriceHistory';
import { Format } from '../../data/entities/Format';
import { Audit } from '../../data/entities/Audit';
import { AuditActionType } from '../../data/entities/audit.types';
import { getDb } from '../../data/db';
import moment from 'moment-timezone';
import { revalidatePath } from 'next/cache';
import { getCurrentUserSession } from './auth.server';
import { EntityManager, IsNull, Like } from 'typeorm';

const APP_TIMEZONE = 'America/Santiago';
const VARIETIES_PATH = '/home/varieties';

function normalizeQualityPrices(raw: unknown): VarietyQualityPrice[] {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.map((entry) => ({
    qualityId: Number(entry?.qualityId),
    qualityName: String(entry?.qualityName ?? ''),
    priceCLP: Number(entry?.priceCLP ?? 0) || 0,
    priceUSD: Number(entry?.priceUSD ?? 0) || 0,
    currency: entry?.currency === Currency.USD ? Currency.USD : Currency.CLP,
    active: entry?.active === undefined ? true : Boolean(entry.active),
  })).filter((e) => Number.isFinite(e.qualityId) && e.qualityId > 0);
}

function serializeVariety(variety: Variety): any {
  return JSON.parse(JSON.stringify({
    id: variety.id,
    name: variety.name,
    qualityPrices: normalizeQualityPrices(variety.qualityPrices),
    deletedAt: variety.deletedAt,
  }));
}

function serializeVarieties(varieties: Variety[]): any[] {
  return varieties.map(serializeVariety);
}

export interface CreateVarietyInput {
  name: string;
}

export interface UpdateVarietyInput {
  id: number;
  name?: string;
}

export interface GetVarietiesFilters {
  name?: string;
}

export interface VarietyResult {
  success: boolean;
  message?: string;
  data?: Variety | Variety[] | null;
  error?: string;
}

export type QualityPriceUpdate = {
  qualityId: number;
  priceCLP: number;
  priceUSD: number;
  currency: Currency;
};

async function logVarietyAudit(
  manager: EntityManager,
  entityId: string,
  action: AuditActionType,
  userId: string | undefined,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>
) {
  try {
    const crypto = require('crypto');
    const auditId = crypto.randomUUID();
    const fields: Record<string, any> = {};
    let changeCount = 0;

    if (oldValues && newValues) {
      for (const key in newValues) {
        if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
          fields[key] = { oldValue: oldValues[key], newValue: newValues[key] };
          changeCount++;
        }
      }
    } else if (newValues && !oldValues) {
      for (const key in newValues) {
        fields[key] = { oldValue: null, newValue: newValues[key] };
        changeCount++;
      }
    } else if (oldValues && !newValues) {
      for (const key in oldValues) {
        fields[key] = { oldValue: oldValues[key], newValue: null };
        changeCount++;
      }
    }

    const audit = manager.create(Audit, {
      id: auditId,
      entityName: 'Variety',
      entityId,
      userId,
      action,
      description: `${action} variety ${entityId}`,
      oldValues,
      newValues,
      changes: changeCount > 0 ? fields : undefined,
      createdAt: new Date(moment.tz(APP_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')),
    });

    await manager.save(Audit, audit);
  } catch (error) {
    console.error('[logVarietyAudit] Error:', error);
  }
}

async function buildQualityPricesFromFormats(
  manager: EntityManager,
  defaultPriceCLP = 0,
): Promise<VarietyQualityPrice[]> {
  const formats = await manager.getRepository(Format).find({
    where: { deletedAt: IsNull() },
    order: { id: 'ASC' },
  });
  return formats.map((f) => ({
    qualityId: f.id,
    qualityName: f.name,
    priceCLP: defaultPriceCLP,
    priceUSD: 0,
    currency: Currency.CLP,
    active: f.active !== false,
  }));
}

async function appendHistoryEntries(
  manager: EntityManager,
  varietyId: number,
  entries: VarietyQualityPrice[],
  source: VarietyPriceHistorySource,
  userId?: string,
) {
  const repo = manager.getRepository(VarietyPriceHistory);
  for (const entry of entries) {
    await repo.save(
      repo.create({
        varietyId,
        qualityId: entry.qualityId,
        qualityName: entry.qualityName,
        priceCLP: entry.priceCLP,
        priceUSD: entry.priceUSD,
        currency: entry.currency,
        source,
        changedByUserId: userId ?? null,
      }),
    );
  }
}

export async function getVarieties(filters?: GetVarietiesFilters): Promise<VarietyResult> {
  try {
    const db = await getDb();
    const where: any = {};
    if (filters?.name?.trim()) {
      where.name = Like(`%${filters.name.trim()}%`);
    }
    const rows = await db.getRepository(Variety).find({
      where,
      order: { id: 'ASC' },
    });
    return { success: true, data: serializeVarieties(rows) };
  } catch (error: any) {
    console.error('[getVarieties] Error:', error);
    return { success: false, error: error?.message || 'Error al obtener variedades', data: [] };
  }
}

export async function getVarietyById(id: number): Promise<VarietyResult> {
  try {
    if (!id || id <= 0) {
      return { success: false, error: 'ID inválido', data: null };
    }
    const db = await getDb();
    const variety = await db.getRepository(Variety).findOne({ where: { id } });
    if (!variety) {
      return { success: false, error: 'Variedad no encontrada', data: null };
    }
    return { success: true, data: serializeVariety(variety) };
  } catch (error: any) {
    console.error('[getVarietyById] Error:', error);
    return { success: false, error: error?.message || 'Error al obtener la variedad', data: null };
  }
}

export async function createVariety(data: CreateVarietyInput, auditUserId?: string): Promise<VarietyResult> {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: 'El nombre es requerido' };
    }

    let userId = auditUserId;
    if (!userId) {
      try {
        const session = await getCurrentUserSession();
        userId = session.userId;
      } catch {
        // optional
      }
    }

    const db = await getDb();
    const result = await db.transaction(async (manager) => {
      const repo = manager.getRepository(Variety);
      const existing = await repo.findOne({ where: { name: data.name.trim() } });
      if (existing) {
        throw new Error('Ya existe una variedad con ese nombre');
      }

      const qualityPrices = await buildQualityPricesFromFormats(manager, 0);
      const saved = await repo.save(
        repo.create({
          name: data.name.trim(),
          qualityPrices,
        }),
      );

      await appendHistoryEntries(
        manager,
        saved.id,
        qualityPrices,
        VarietyPriceHistorySource.VARIETY_CREATED,
        userId,
      );

      await logVarietyAudit(manager, saved.id.toString(), AuditActionType.CREATE, userId, undefined, {
        name: saved.name,
        qualityPrices,
      });

      return saved;
    });

    revalidatePath(VARIETIES_PATH);
    return {
      success: true,
      message: 'Variedad creada exitosamente',
      data: serializeVariety(result),
    };
  } catch (error: any) {
    console.error('[createVariety] Error:', error);
    return { success: false, error: error?.message || 'Error al crear la variedad' };
  }
}

export async function updateVariety(data: UpdateVarietyInput, auditUserId?: string): Promise<VarietyResult> {
  try {
    if (!data.id || data.id <= 0) {
      return { success: false, error: 'ID inválido' };
    }
    if (data.name !== undefined && !data.name?.trim()) {
      return { success: false, error: 'El nombre no puede estar vacío' };
    }

    let userId = auditUserId;
    if (!userId) {
      try {
        const session = await getCurrentUserSession();
        userId = session.userId;
      } catch {
        // optional
      }
    }

    const db = await getDb();
    const result = await db.transaction(async (manager) => {
      const repo = manager.getRepository(Variety);
      const existing = await repo.findOne({ where: { id: data.id } });
      if (!existing) {
        throw new Error('Variedad no encontrada');
      }

      if (data.name && data.name.trim() !== existing.name) {
        const nameExists = await repo.findOne({ where: { name: data.name.trim() } });
        if (nameExists) {
          throw new Error('Ya existe una variedad con ese nombre');
        }
      }

      const oldValues = { name: existing.name };
      if (data.name !== undefined) existing.name = data.name.trim();
      const saved = await repo.save(existing);

      await logVarietyAudit(manager, saved.id.toString(), AuditActionType.UPDATE, userId, oldValues, {
        name: saved.name,
      });

      return saved;
    });

    revalidatePath(VARIETIES_PATH);
    return {
      success: true,
      message: 'Variedad actualizada exitosamente',
      data: serializeVariety(result),
    };
  } catch (error: any) {
    console.error('[updateVariety] Error:', error);
    return { success: false, error: error?.message || 'Error al actualizar la variedad' };
  }
}

export async function deleteVariety(id: number, auditUserId?: string): Promise<VarietyResult> {
  try {
    if (!id || id <= 0) {
      return { success: false, error: 'ID inválido' };
    }

    let userId = auditUserId;
    if (!userId) {
      try {
        const session = await getCurrentUserSession();
        userId = session.userId;
      } catch {
        // optional
      }
    }

    const db = await getDb();
    await db.transaction(async (manager) => {
      const repo = manager.getRepository(Variety);
      const variety = await repo.findOne({ where: { id } });
      if (!variety) {
        throw new Error('Variedad no encontrada');
      }
      await logVarietyAudit(
        manager,
        id.toString(),
        AuditActionType.DELETE,
        userId,
        { name: variety.name, qualityPrices: normalizeQualityPrices(variety.qualityPrices) },
        undefined,
      );
      await repo.softDelete(id);
    });

    revalidatePath(VARIETIES_PATH);
    return { success: true, message: 'Variedad eliminada exitosamente' };
  } catch (error: any) {
    console.error('[deleteVariety] Error:', error);
    return { success: false, error: error?.message || 'Error al eliminar la variedad' };
  }
}

export async function getVarietiesSimpleList(): Promise<{ id: number; label: string }[]> {
  try {
    const db = await getDb();
    const varieties = await db.getRepository(Variety).find({
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });
    return varieties.map((v) => ({ id: v.id, label: v.name }));
  } catch (error) {
    console.error('[getVarietiesSimpleList] Error:', error);
    return [];
  }
}

function resolveEntryPrice(entry: VarietyQualityPrice): number {
  return entry.currency === Currency.USD ? entry.priceUSD : entry.priceCLP;
}

export async function getVarietyQualityPrice(
  varietyId: number,
  qualityId: number,
): Promise<{ success: boolean; price?: number; currency?: Currency; entry?: VarietyQualityPrice; error?: string }> {
  try {
    if (!varietyId || !qualityId) {
      return { success: false, error: 'varietyId y qualityId son requeridos' };
    }
    const db = await getDb();
    const variety = await db.getRepository(Variety).findOne({ where: { id: varietyId } });
    if (!variety) {
      return { success: false, error: 'Variedad no encontrada' };
    }
    const entry = normalizeQualityPrices(variety.qualityPrices).find((e) => e.qualityId === qualityId);
    if (!entry) {
      return { success: false, error: 'Calidad no configurada en esta variedad' };
    }
    return {
      success: true,
      price: resolveEntryPrice(entry),
      currency: entry.currency,
      entry,
    };
  } catch (error: any) {
    console.error('[getVarietyQualityPrice] Error:', error);
    return { success: false, error: error?.message || 'Error al obtener precio' };
  }
}

export async function updateVarietyQualityPrice(
  input: { varietyId: number } & QualityPriceUpdate,
  auditUserId?: string,
): Promise<VarietyResult> {
  return updateVarietyQualityPricesBulk(
    {
      varietyId: input.varietyId,
      updates: [{
        qualityId: input.qualityId,
        priceCLP: input.priceCLP,
        priceUSD: input.priceUSD,
        currency: input.currency,
      }],
      source: VarietyPriceHistorySource.SINGLE,
    },
    auditUserId,
  );
}

export async function updateVarietyQualityPricesBulk(
  input: {
    varietyId: number;
    updates: QualityPriceUpdate[];
    source?: VarietyPriceHistorySource;
  },
  auditUserId?: string,
): Promise<VarietyResult> {
  try {
    const { varietyId, updates } = input;
    if (!varietyId || !Array.isArray(updates) || updates.length === 0) {
      return { success: false, error: 'Datos de actualización inválidos' };
    }

    for (const u of updates) {
      if (!u.qualityId || u.qualityId <= 0) {
        return { success: false, error: 'qualityId inválido' };
      }
      if (u.priceCLP < 0 || u.priceUSD < 0) {
        return { success: false, error: 'Los precios no pueden ser negativos' };
      }
      if (!Object.values(Currency).includes(u.currency)) {
        return { success: false, error: 'Moneda inválida' };
      }
    }

    let userId = auditUserId;
    if (!userId) {
      try {
        const session = await getCurrentUserSession();
        userId = session.userId;
      } catch {
        // optional
      }
    }

    const source = input.source ?? (
      updates.length > 1 ? VarietyPriceHistorySource.BULK : VarietyPriceHistorySource.SINGLE
    );

    const db = await getDb();
    const saved = await db.transaction(async (manager) => {
      const repo = manager.getRepository(Variety);
      const variety = await repo.findOne({ where: { id: varietyId } });
      if (!variety) {
        throw new Error('Variedad no encontrada');
      }

      const prices = normalizeQualityPrices(variety.qualityPrices);
      const historyEntries: VarietyQualityPrice[] = [];

      for (const update of updates) {
        const idx = prices.findIndex((p) => p.qualityId === update.qualityId);
        if (idx < 0) {
          throw new Error(`Calidad ${update.qualityId} no existe en la variedad`);
        }
        const next: VarietyQualityPrice = {
          ...prices[idx],
          priceCLP: update.priceCLP,
          priceUSD: update.priceUSD,
          currency: update.currency,
        };
        prices[idx] = next;
        historyEntries.push(next);
      }

      variety.qualityPrices = prices;
      const result = await repo.save(variety);
      await appendHistoryEntries(manager, varietyId, historyEntries, source, userId);
      await logVarietyAudit(
        manager,
        String(varietyId),
        AuditActionType.UPDATE,
        userId,
        undefined,
        { qualityPrices: historyEntries },
      );
      return result;
    });

    revalidatePath(VARIETIES_PATH);
    return {
      success: true,
      message: 'Precios actualizados',
      data: serializeVariety(saved),
    };
  } catch (error: any) {
    console.error('[updateVarietyQualityPricesBulk] Error:', error);
    return { success: false, error: error?.message || 'Error al actualizar precios' };
  }
}

export async function getVarietyPriceHistory(
  varietyId: number,
  qualityId?: number,
): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    varietyId: number;
    qualityId: number;
    qualityName: string;
    priceCLP: number;
    priceUSD: number;
    currency: Currency;
    source: VarietyPriceHistorySource;
    changedByUserId?: string | null;
    changedAt: string;
  }>;
  error?: string;
}> {
  try {
    if (!varietyId) {
      return { success: false, error: 'varietyId requerido' };
    }
    const db = await getDb();
    const qb = db
      .getRepository(VarietyPriceHistory)
      .createQueryBuilder('h')
      .where('h.varietyId = :varietyId', { varietyId })
      .orderBy('h.changedAt', 'DESC')
      .take(200);

    if (qualityId) {
      qb.andWhere('h.qualityId = :qualityId', { qualityId });
    }

    const rows = await qb.getMany();
    return {
      success: true,
      data: rows.map((h) => ({
        id: String(h.id),
        varietyId: h.varietyId,
        qualityId: h.qualityId,
        qualityName: h.qualityName,
        priceCLP: h.priceCLP,
        priceUSD: h.priceUSD,
        currency: h.currency,
        source: h.source,
        changedByUserId: h.changedByUserId,
        changedAt: h.changedAt ? new Date(h.changedAt).toISOString() : '',
      })),
    };
  } catch (error: any) {
    console.error('[getVarietyPriceHistory] Error:', error);
    return { success: false, error: error?.message || 'Error al obtener historial' };
  }
}

/**
 * Upsert a quality type onto every variety's qualityPrices map.
 * Used when creating/updating a Format/Calidad (name + active mirrored).
 */
export async function syncQualityTypeOntoAllVarieties(
  quality: { id: number; name: string; active?: boolean },
  auditUserId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const active = quality.active === undefined ? true : Boolean(quality.active);
    const db = await getDb();
    await db.transaction(async (manager) => {
      const varieties = await manager.getRepository(Variety).find();
      for (const variety of varieties) {
        const prices = normalizeQualityPrices(variety.qualityPrices);
        const idx = prices.findIndex((p) => p.qualityId === quality.id);
        if (idx >= 0) {
          const prev = prices[idx];
          if (prev.qualityName === quality.name && prev.active === active) {
            continue;
          }
          prices[idx] = { ...prev, qualityName: quality.name, active };
          variety.qualityPrices = prices;
          await manager.getRepository(Variety).save(variety);
          continue;
        }
        const entry: VarietyQualityPrice = {
          qualityId: quality.id,
          qualityName: quality.name,
          priceCLP: 0,
          priceUSD: 0,
          currency: Currency.CLP,
          active,
        };
        prices.push(entry);
        variety.qualityPrices = prices;
        await manager.getRepository(Variety).save(variety);
        await appendHistoryEntries(
          manager,
          variety.id,
          [entry],
          VarietyPriceHistorySource.QUALITY_CREATED,
          auditUserId,
        );
      }
    });
    revalidatePath(VARIETIES_PATH);
    return { success: true };
  } catch (error: any) {
    console.error('[syncQualityTypeOntoAllVarieties] Error:', error);
    return { success: false, error: error?.message || 'Error al sincronizar calidades' };
  }
}
