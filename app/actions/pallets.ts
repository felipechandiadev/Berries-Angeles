// Server Actions para CRUD de la entidad Pallet
'use server';

import { Pallet, PalletStatus, PalletMetadata } from '../../data/entities/Pallet';
import { Tray } from '../../data/entities/Tray';
import { Audit } from '../../data/entities/Audit';
import { AuditActionType } from '../../data/entities/audit.types';
import { getDb } from '../../data/db';
import moment from 'moment-timezone';
import { revalidatePath } from 'next/cache';
import { getCurrentUserSession } from './auth.server';
import { EntityManager, IsNull } from 'typeorm';
import {
  applyTextSearch,
  normalizeString,
  normalizeSqlExpr,
  parseColumnFilters,
  resolveLimit,
  resolvePage,
  resolveSortField,
  resolveSortOrder,
} from '@/lib/gridQuery';

const APP_TIMEZONE = 'America/Santiago';

/**
 * Convierte una entidad Pallet a un objeto plano serializable
 */
function serializePallet(pallet: Pallet): any {
  const weight = Number((pallet as any).weight ?? 0);
  const dispatchWeight = Number((pallet as any).dispatchWeight ?? 0);

  return JSON.parse(JSON.stringify({
    id: pallet.id,
    trayId: pallet.trayId,
    trayName: pallet.tray ? pallet.tray.name : null,
    trayWeight: pallet.tray ? Number(pallet.tray.weight ?? 0) : null,
    traysQuantity: typeof pallet.traysQuantity === 'number' ? pallet.traysQuantity : 0,
    capacity: pallet.capacity,
    weight,
    dispatchWeight,
    status: pallet.status,
    metadata: pallet.metadata ?? null,
    createdAt: pallet.createdAt,
    updatedAt: pallet.updatedAt,
    deletedAt: pallet.deletedAt,
  }));
}

/**
 * Convierte un array de entidades Pallet a objetos planos serializables
 */
function serializePallets(pallets: Pallet[]): any[] {
  return pallets.map(serializePallet);
}

export interface CreatePalletInput {
  trayId: string;
  traysQuantity?: number;
  capacity: number;
  weight: number;
  dispatchWeight: number;
  status?: PalletStatus;
  metadata?: PalletMetadata;
}

export interface UpdatePalletInput {
  id: number;
  trayId?: string;
  traysQuantity?: number;
  capacity?: number;
  weight?: number;
  dispatchWeight?: number;
  status?: PalletStatus;
  metadata?: PalletMetadata;
}

export interface GetPalletsFilters {
  trayId?: string;
  status?: PalletStatus;
}

export interface PalletResult {
  success: boolean;
  message?: string;
  data?: Pallet | Pallet[] | null;
  error?: string;
}

export interface PalletGridFilters {
  fields?: string;
  page?: number;
  limit?: number;
  search?: string;
  filtration?: boolean;
  filters?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

export interface PalletGridResponse {
  data: any[];
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
}

export interface PalletExportResponse {
  success: boolean;
  data?: any[];
  recordCount?: number;
  error?: string;
}

export interface PalletAvailabilitySummary {
  id: number;
  trayId: string;
  trayName: string | null;
  status: PalletStatus;
  capacity: number;
  traysQuantity: number;
  availableTrays: number;
  weight: number;
  dispatchWeight: number;
  availableWeight: number;
  metadata: PalletMetadata;
  updatedAt: Date;
}

export interface AvailablePalletFilters {
  trayId?: string;
  excludePalletId?: number;
}

const PALLET_VALID_FIELDS = [
  'id',
  'trayId',
  'trayName',
  'traysQuantity',
  'capacity',
  'weight',
  'dispatchWeight',
  'status',
  'createdAt',
  'updatedAt',
];

const PALLET_VALID_SORT_FIELDS = [
  'id',
  'trayName',
  'trayId',
  'traysQuantity',
  'capacity',
  'weight',
  'dispatchWeight',
  'status',
  'createdAt',
  'updatedAt',
];

function palletDateFilterSql(column: string, value: string, paramName: string): { clause: string; params: Record<string, string> } {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return {
      clause: `DATE(${column}) = :${paramName}`,
      params: { [paramName]: trimmed },
    };
  }
  const like = `%${normalizeString(trimmed)}%`;
  return {
    clause: `(DATE_FORMAT(${column}, '%d-%m-%Y %H:%i') LIKE :${paramName} OR DATE_FORMAT(${column}, '%d-%m-%Y') LIKE :${paramName} OR DATE_FORMAT(${column}, '%Y-%m-%d') LIKE :${paramName})`,
    params: { [paramName]: like },
  };
}

function applyPalletFilters(query: any, filters?: PalletGridFilters) {
  if (!filters) {
    return query;
  }

  if (filters.filtration && filters.filters) {
    const columnFilters = parseColumnFilters(filters.filters, PALLET_VALID_FIELDS);

    columnFilters.forEach((filter, index) => {
      const paramName = `colFilter${index}`;
      const normalizedValue = normalizeString(filter.value);

      switch (filter.column) {
        case 'status':
          query = query.andWhere(`pallet.status = :${paramName}`, {
            [paramName]: filter.value as PalletStatus,
          });
          break;
        case 'trayName':
          query = query.andWhere(`${normalizeSqlExpr('tray.name')} LIKE :${paramName}`, {
            [paramName]: `%${normalizedValue}%`,
          });
          break;
        case 'trayId':
          query = query.andWhere(`${normalizeSqlExpr('pallet.trayId')} LIKE :${paramName}`, {
            [paramName]: `%${normalizedValue}%`,
          });
          break;
        case 'createdAt':
        case 'updatedAt': {
          const { clause, params } = palletDateFilterSql(`pallet.${filter.column}`, filter.value, paramName);
          query = query.andWhere(clause, params);
          break;
        }
        case 'id':
        case 'traysQuantity':
        case 'capacity':
        case 'weight':
        case 'dispatchWeight': {
          const numericValue = Number(filter.value);
          if (!Number.isNaN(numericValue)) {
            query = query.andWhere(`pallet.${filter.column} = :${paramName}`, {
              [paramName]: numericValue,
            });
          }
          break;
        }
        default:
          query = query.andWhere(`${normalizeSqlExpr(`pallet.${filter.column}`)} LIKE :${paramName}`, {
            [paramName]: `%${normalizedValue}%`,
          });
          break;
      }
    });
  }

  if (filters.search?.trim()) {
    applyTextSearch(query, {
      columns: [
        'tray.name',
        'pallet.status',
        'pallet.trayId',
        'CAST(pallet.id AS CHAR)',
        'CAST(pallet.traysQuantity AS CHAR)',
        'CAST(pallet.capacity AS CHAR)',
        'CAST(pallet.weight AS CHAR)',
        'CAST(pallet.dispatchWeight AS CHAR)',
        "DATE_FORMAT(pallet.updatedAt, '%d-%m-%Y %H:%i')",
        "DATE_FORMAT(pallet.updatedAt, '%d-%m-%Y')",
        "DATE_FORMAT(pallet.updatedAt, '%Y-%m-%d')",
        "DATE_FORMAT(pallet.createdAt, '%d-%m-%Y %H:%i')",
        "DATE_FORMAT(pallet.createdAt, '%d-%m-%Y')",
        "DATE_FORMAT(pallet.createdAt, '%Y-%m-%d')",
      ],
      search: filters.search,
      paramName: 'search',
    });
  }

  return query;
}

/**
 * Helper function to log audit for pallet
 * Uses Chile timezone (America/Santiago) for consistent timestamp handling
 */
async function logPalletAudit(
  manager: EntityManager,
  entityId: string | number,
  action: AuditActionType,
  userId: string | undefined,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>
) {
  try {
    console.log('[logPalletAudit] Iniciando registro de auditoría. userId:', userId, 'action:', action);

    const crypto = require('crypto');
    const auditId = crypto.randomUUID();
    const entityIdString = String(entityId);

    // Crear los cambios detectados
    const fields: Record<string, any> = {};
    let changeCount = 0;

    if (oldValues && newValues) {
      // Para UPDATE, comparar valores viejos y nuevos
      for (const key in newValues) {
        if (oldValues[key] !== newValues[key]) {
          fields[key] = {
            oldValue: oldValues[key],
            newValue: newValues[key],
          };
          changeCount++;
        }
      }
    } else if (newValues && !oldValues) {
      // Para CREATE, todos los valores son nuevos
      for (const key in newValues) {
        fields[key] = {
          oldValue: null,
          newValue: newValues[key],
        };
        changeCount++;
      }
    } else if (oldValues && !newValues) {
      // Para DELETE, todos los valores se eliminan
      for (const key in oldValues) {
        fields[key] = {
          oldValue: oldValues[key],
          newValue: null,
        };
        changeCount++;
      }
    }

    const audit = manager.create(Audit, {
      id: auditId,
      entityName: 'Pallet',
      entityId: entityIdString,
      userId: userId,
      action: action,
      description: `${action} pallet ${entityIdString}`,
      oldValues: oldValues,
      newValues: newValues,
      changes: changeCount > 0 ? fields : undefined,
      createdAt: new Date(moment.tz(APP_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')), // Use Chile timezone for consistent timestamp
    });

    await manager.save(Audit, audit);
    console.log('[logPalletAudit] Auditoría registrada exitosamente');
  } catch (error) {
    console.error('[logPalletAudit] Error al registrar auditoría:', error);
    // No fallar la operación principal por error de auditoría
  }
}

/**
 * GET - Obtener todos los pallets con filtros opcionales
 */
export async function getPallets(filters?: GetPalletsFilters): Promise<PalletResult> {
  try {
    const db = await getDb();
    const repo = db.getRepository(Pallet);

    const queryBuilder = repo.createQueryBuilder('pallet')
      .leftJoinAndSelect('pallet.tray', 'tray');

    // Aplicar filtros
    if (filters?.trayId) {
      queryBuilder.andWhere('pallet.trayId = :trayId', { trayId: filters.trayId });
    }

    if (filters?.status) {
      queryBuilder.andWhere('pallet.status = :status', { status: filters.status });
    }

    // Solo registros no eliminados
    queryBuilder.andWhere('pallet.deletedAt IS NULL');

    // Ordenar por fecha de creación descendente (más recientes primero)
    queryBuilder.orderBy('pallet.createdAt', 'DESC');

    const pallets = await queryBuilder.getMany();

    return {
      success: true,
      data: serializePallets(pallets),
    };
  } catch (error: any) {
    console.error('[getPallets] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al obtener los pallets',
    };
  }
}

export async function getAvailablePalletSummaries(filters?: AvailablePalletFilters): Promise<{
  success: boolean;
  data?: PalletAvailabilitySummary[];
  error?: string;
}> {
  try {
    const db = await getDb();
    const repo = db.getRepository(Pallet);

    const query = repo.createQueryBuilder('pallet')
      .leftJoinAndSelect('pallet.tray', 'tray')
      .where('pallet.deletedAt IS NULL')
      .andWhere('pallet.status = :status', { status: PalletStatus.AVAILABLE })
      .andWhere('pallet.traysQuantity < pallet.capacity')
      .orderBy('pallet.updatedAt', 'DESC');

    if (filters?.trayId) {
      query.andWhere('pallet.trayId = :trayId', { trayId: filters.trayId });
    }

    if (filters?.excludePalletId) {
      query.andWhere('pallet.id <> :excludePalletId', { excludePalletId: filters.excludePalletId });
    }

    const pallets = await query.getMany();

    const summaries: PalletAvailabilitySummary[] = pallets.map((pallet) => {
      const weight = Number((pallet as any).weight ?? 0);
      const dispatchWeight = Number((pallet as any).dispatchWeight ?? 0);
      const traysQuantity = typeof pallet.traysQuantity === 'number' ? pallet.traysQuantity : 0;
      const capacity = typeof pallet.capacity === 'number' ? pallet.capacity : 0;
      const availableTrays = Math.max(capacity - traysQuantity, 0);
      const availableWeight = Math.max(weight - dispatchWeight, 0);

      return {
        id: pallet.id,
        trayId: pallet.trayId,
        trayName: pallet.tray ? pallet.tray.name : null,
        status: pallet.status,
        capacity,
        traysQuantity,
        availableTrays,
        weight,
        dispatchWeight,
        availableWeight,
        metadata: pallet.metadata ?? null,
        updatedAt: pallet.updatedAt,
      };
    });

    return {
      success: true,
      data: summaries,
    };
  } catch (error: any) {
    console.error('[getAvailablePalletSummaries] Error:', error);

    if (error?.code === 'ER_BAD_FIELD_ERROR') {
      return {
        success: false,
        error: 'La columna metadata no existe en la tabla pallets. Ejecuta la migración update-pallets-table para sincronizar el esquema.',
      };
    }

    return {
      success: false,
      error: error?.message || 'Error al obtener pallets disponibles',
    };
  }
}

/**
 * GET - Obtener un pallet por ID
 */
export async function getPalletById(id: string | number): Promise<PalletResult> {
  try {
    const palletId = Number(id);
    if (!Number.isInteger(palletId) || palletId < 1) {
      return { success: false, error: 'ID inválido' };
    }

    const db = await getDb();
    const pallet = await db.getRepository(Pallet).findOne({
      where: { id: palletId, deletedAt: IsNull() },
      relations: ['tray']
    });

    if (!pallet) {
      return { success: false, error: 'Pallet no encontrado' };
    }

    return {
      success: true,
      data: pallet,
    };
  } catch (error: any) {
    console.error('[getPalletById] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al obtener el pallet',
    };
  }
}

/**
 * GET - Obtener pallets con paginación, filtros y ordenamiento para DataGrid
 */
export async function getPalletsGridData(
  filters?: PalletGridFilters
): Promise<PalletGridResponse> {
  const safeLimit = resolveLimit(filters?.limit, 25);

  try {
    const db = await getDb();

    const requestedFields = filters?.fields
      ? filters.fields.split(',').map(field => field.trim()).filter(field => PALLET_VALID_FIELDS.includes(field))
      : PALLET_VALID_FIELDS;

    if (requestedFields.length === 0) {
      requestedFields.push('id');
    }

    const page = resolvePage(filters?.page, 1);
    const sortOrder = resolveSortOrder(filters?.sortOrder, 'DESC');
    const sortByRaw = resolveSortField(filters?.sortBy, PALLET_VALID_SORT_FIELDS, 'createdAt');

    let query = db
      .getRepository(Pallet)
      .createQueryBuilder('pallet')
      .leftJoinAndSelect('pallet.tray', 'tray')
      .where('pallet.deletedAt IS NULL');

    query = applyPalletFilters(query, filters);

    const total = await query.getCount();

    const sortColumn = sortByRaw === 'trayName'
      ? 'tray.name'
      : `pallet.${sortByRaw}`;

    const data = await query
      .clone()
      .orderBy(sortColumn, sortOrder)
      .skip((page - 1) * safeLimit)
      .take(safeLimit)
      .getMany();

    const serialized = serializePallets(data);

    const shaped = serialized.map((row) => {
      if (!filters?.fields) {
        return row;
      }

      const shapedRow: Record<string, any> = {};
      requestedFields.forEach((field) => {
        shapedRow[field] = (row as Record<string, any>)[field];
      });

      if (!requestedFields.includes('id')) {
        shapedRow.id = row.id;
      }

      if (!requestedFields.includes('trayName')) {
        shapedRow.trayName = (row as Record<string, any>).trayName;
      }

      return shapedRow;
    });

    return {
      data: shaped,
      total,
      pages: Math.ceil(total / safeLimit),
      currentPage: page,
      limit: safeLimit,
    };
  } catch (error) {
    console.error('[getPalletsGridData] Error:', error);
    return {
      data: [],
      total: 0,
      pages: 0,
      currentPage: 1,
      limit: safeLimit,
    };
  }
}

/**
 * GET - Obtener pallets para exportar a Excel (máx. 10.000 registros)
 */
export async function getPalletsExportData(filters?: PalletGridFilters): Promise<PalletExportResponse> {
  try {
    const db = await getDb();
    const maxRows = 10000;

    const sortOrder = resolveSortOrder(filters?.sortOrder, 'DESC');
    const sortByRaw = resolveSortField(filters?.sortBy, PALLET_VALID_SORT_FIELDS, 'createdAt');

    let query = db
      .getRepository(Pallet)
      .createQueryBuilder('pallet')
      .leftJoinAndSelect('pallet.tray', 'tray')
      .where('pallet.deletedAt IS NULL');

    query = applyPalletFilters(query, filters);

    const sortColumn = sortByRaw === 'trayName'
      ? 'tray.name'
      : `pallet.${sortByRaw}`;

    const rows = await query
      .orderBy(sortColumn, sortOrder)
      .take(maxRows + 1)
      .getMany();

    if (rows.length > maxRows) {
      return {
        success: false,
        error: `Total de registros (${rows.length}) excede el límite permitido de ${maxRows}. Refina los filtros antes de exportar.`,
      };
    }

    const serialized = serializePallets(rows);

    return {
      success: true,
      data: serialized,
      recordCount: serialized.length,
    };
  } catch (error) {
    console.error('[getPalletsExportData] Error:', error);
    return {
      success: false,
      error: `Error al obtener pallets para exportación: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * CREATE - Crear un nuevo pallet
 */
export async function createPallet(data: CreatePalletInput, auditUserId?: string): Promise<PalletResult> {
  try {
    // Validaciones
    if (!data.trayId || data.trayId.trim() === '') {
      return { success: false, error: 'El trayId es requerido' };
    }

    const traysQuantity = data.traysQuantity ?? 0;
    if (traysQuantity < 0) {
      return { success: false, error: 'La cantidad de bandejas no puede ser negativa' };
    }

    if (data.capacity === undefined || data.capacity < 1) {
      return { success: false, error: 'La capacidad debe ser mayor a 0' };
    }

    if (data.weight === undefined || data.weight < 0) {
      return { success: false, error: 'El peso inicial debe ser un número positivo' };
    }

    if (data.dispatchWeight === undefined || data.dispatchWeight < 0) {
      return { success: false, error: 'El peso de despacho debe ser un número positivo' };
    }

    if (data.dispatchWeight > data.weight) {
      return { success: false, error: 'El peso de despacho no puede ser mayor que el peso inicial' };
    }

    if (traysQuantity > data.capacity) {
      return { success: false, error: 'La cantidad de bandejas no puede exceder la capacidad' };
    }

    const db = await getDb();

    const tray = await db.getRepository(Tray).findOne({
      where: { id: data.trayId, deletedAt: IsNull() }
    });

    if (!tray) {
      return { success: false, error: 'Tray no encontrado' };
    }

    // Obtener userId para auditoría si no se proporcionó
    let userId = auditUserId;
    if (!userId) {
      try {
        const { userId: sessionUserId } = await getCurrentUserSession();
        userId = sessionUserId;
      } catch (error) {
        console.warn('[createPallet] No se pudo obtener la sesión del usuario para auditoría');
      }
    }

    const palletData = {
      trayId: data.trayId,
      traysQuantity,
      capacity: data.capacity,
      weight: data.weight,
      dispatchWeight: data.dispatchWeight,
      status: data.status || PalletStatus.AVAILABLE,
      metadata: data.metadata ?? null,
    };

    const result = await db.transaction(async (manager) => {
      const pallet = manager.create(Pallet, palletData);
      const savedPallet = await manager.save(Pallet, pallet);

      // Registrar auditoría
      await logPalletAudit(
        manager,
        savedPallet.id,
        AuditActionType.CREATE,
        userId,
        undefined,
        palletData
      );

      return savedPallet;
    });

    try {
      revalidatePath('/home/dispatch/pallets');
    } catch (revalidateError) {
      console.warn('[createPallet] No se pudo ejecutar revalidatePath:', revalidateError);
    }

    return {
      success: true,
      message: 'Pallet creado exitosamente',
      data: result ? serializePallet(result) : null,
    };
  } catch (error: any) {
    console.error('[createPallet] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al crear el pallet',
    };
  }
}

/**
 * UPDATE - Actualizar un pallet existente
 */
export async function updatePallet(data: UpdatePalletInput, auditUserId?: string): Promise<PalletResult> {
  try {
    const palletId = Number(data.id);
    if (!Number.isInteger(palletId) || palletId < 1) {
      return { success: false, error: 'ID inválido' };
    }

    const db = await getDb();

    // Obtener el pallet actual
    const existingPallet = await db.getRepository(Pallet).findOne({
      where: { id: palletId, deletedAt: IsNull() }
    });

    if (!existingPallet) {
      return { success: false, error: 'Pallet no encontrado' };
    }

    // Validaciones y actualizaciones
    const updates: Partial<Pallet> = {};

    if (data.trayId !== undefined) {
      if (!data.trayId.trim()) {
        return { success: false, error: 'El trayId es requerido' };
      }

      // Verificar que el tray existe
      const tray = await db.getRepository(Tray).findOne({
        where: { id: data.trayId, deletedAt: IsNull() }
      });

      if (!tray) {
        return { success: false, error: 'Tray no encontrado' };
      }

      updates.trayId = data.trayId;
    }

    if (data.traysQuantity !== undefined) {
      if (data.traysQuantity < 0) {
        return { success: false, error: 'La cantidad de bandejas no puede ser negativa' };
      }
      updates.traysQuantity = data.traysQuantity;
    }

    if (data.capacity !== undefined) {
      if (data.capacity < 1) {
        return { success: false, error: 'La capacidad debe ser mayor a 0' };
      }
      updates.capacity = data.capacity;
    }

    if (data.weight !== undefined) {
      if (data.weight < 0) {
        return { success: false, error: 'El peso inicial debe ser un número positivo' };
      }
      updates.weight = data.weight;
    }

    if (data.dispatchWeight !== undefined) {
      if (data.dispatchWeight < 0) {
        return { success: false, error: 'El peso de despacho debe ser un número positivo' };
      }
      updates.dispatchWeight = data.dispatchWeight;
    }

    if (data.status !== undefined) {
      updates.status = data.status;
    }

    if (data.metadata !== undefined) {
      updates.metadata = data.metadata ?? null;
    }

    // Verificar que haya cambios
    const nextTraysQuantity = updates.traysQuantity ?? existingPallet.traysQuantity;
    const nextCapacity = updates.capacity ?? existingPallet.capacity;
    if (nextTraysQuantity > nextCapacity) {
      return { success: false, error: 'La cantidad de bandejas no puede exceder la capacidad' };
    }

    const nextWeight = updates.weight ?? existingPallet.weight;
    const nextDispatchWeight = updates.dispatchWeight ?? existingPallet.dispatchWeight;
    if (nextDispatchWeight > nextWeight) {
      return { success: false, error: 'El peso de despacho no puede ser mayor que el peso inicial' };
    }

    const hasChanges = Object.keys(updates).length > 0;
    if (!hasChanges) {
      return { success: false, error: 'No se detectaron cambios' };
    }

    // Obtener userId para auditoría si no se proporcionó
    let userId = auditUserId;
    if (!userId) {
      try {
        const { userId: sessionUserId } = await getCurrentUserSession();
        userId = sessionUserId;
      } catch (error) {
        console.warn('[updatePallet] No se pudo obtener la sesión del usuario para auditoría');
      }
    }

    const oldValues = {
      trayId: existingPallet.trayId,
      traysQuantity: existingPallet.traysQuantity,
      capacity: existingPallet.capacity,
      weight: existingPallet.weight,
      dispatchWeight: existingPallet.dispatchWeight,
      status: existingPallet.status,
      metadata: existingPallet.metadata ?? null,
    };

    const result = await db.transaction(async (manager) => {
      await manager.update(Pallet, palletId, updates);

      const updatedPallet = await manager.findOne(Pallet, {
        where: { id: palletId },
        relations: ['tray']
      });

      // Registrar auditoría
      await logPalletAudit(
        manager,
        palletId,
        AuditActionType.UPDATE,
        userId,
        oldValues,
        updates
      );

      return updatedPallet;
    });

    try {
      revalidatePath('/home/dispatch/pallets');
    } catch (revalidateError) {
      console.warn('[updatePallet] No se pudo ejecutar revalidatePath:', revalidateError);
    }

    return {
      success: true,
      message: 'Pallet actualizado exitosamente',
      data: result ? serializePallet(result) : null,
    };
  } catch (error: any) {
    console.error('[updatePallet] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al actualizar el pallet',
    };
  }
}

/**
 * DELETE - Eliminar un pallet (soft delete)
 */
export async function deletePallet(id: string | number, auditUserId?: string): Promise<PalletResult> {
  try {
    const palletId = Number(id);
    if (!Number.isInteger(palletId) || palletId < 1) {
      return { success: false, error: 'ID inválido' };
    }

    const db = await getDb();

    // Obtener el pallet actual
    const existingPallet = await db.getRepository(Pallet).findOne({
      where: { id: palletId, deletedAt: IsNull() }
    });

    if (!existingPallet) {
      return { success: false, error: 'Pallet no encontrado' };
    }

    // Obtener userId para auditoría si no se proporcionó
    let userId = auditUserId;
    if (!userId) {
      try {
        const { userId: sessionUserId } = await getCurrentUserSession();
        userId = sessionUserId;
      } catch (error) {
        console.warn('[deletePallet] No se pudo obtener la sesión del usuario para auditoría');
      }
    }

    const oldValues = {
      trayId: existingPallet.trayId,
      traysQuantity: existingPallet.traysQuantity,
      capacity: existingPallet.capacity,
      weight: existingPallet.weight,
      dispatchWeight: existingPallet.dispatchWeight,
      status: existingPallet.status,
      metadata: existingPallet.metadata ?? null,
    };

    const result = await db.transaction(async (manager) => {
      // Soft delete
      await manager.update(Pallet, palletId, {
        deletedAt: new Date(),
      });

      // Registrar auditoría
      await logPalletAudit(
        manager,
        palletId,
        AuditActionType.DELETE,
        userId,
        oldValues,
        undefined
      );

      return existingPallet;
    });

    try {
      revalidatePath('/home/dispatch/pallets');
    } catch (revalidateError) {
      console.warn('[deletePallet] No se pudo ejecutar revalidatePath:', revalidateError);
    }

    return {
      success: true,
      message: 'Pallet eliminado exitosamente',
      data: result ? serializePallet(result) : null,
    };
  } catch (error: any) {
    console.error('[deletePallet] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al eliminar el pallet',
    };
  }
}
/**
 * Obtiene una lista simple de pallets
 */
export async function getPalletsSimpleList() {
  try {
    const db = await getDb();
    const palletRepository = db.getRepository(Pallet);

    const pallets = await palletRepository.find({
      where: { deletedAt: IsNull() },
      relations: ['tray'],
      order: { createdAt: 'DESC' },
    });

    return serializePallets(pallets);
  } catch (error) {
    console.error("Error obteniendo lista de pallets:", error);
    throw error;
  }
}
