// Server Actions para CRUD de la entidad ProductiveUnit
'use server';

import { ProductiveUnit } from '../../data/entities/ProductiveUnit';
import { Audit } from '../../data/entities/Audit';
import { AuditActionType } from '../../data/entities/audit.types';
import { getDb } from '../../data/db';
import moment from 'moment-timezone';
import { revalidatePath } from 'next/cache';
import { getCurrentUserSession } from './auth.server';
import { EntityManager, Like, IsNull } from 'typeorm';

const APP_TIMEZONE = 'America/Santiago';

/**
 * Convierte una entidad ProductiveUnit a un objeto plano serializable
 */
function serializeProductiveUnit(unit: ProductiveUnit): any {
  return JSON.parse(JSON.stringify({
    id: unit.id,
    name: unit.name,
    address: unit.address,
    description: unit.description,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
    deletedAt: unit.deletedAt,
  }));
}

/**
 * Convierte un array de entidades ProductiveUnit a objetos planos serializables
 */
function serializeProductiveUnits(units: ProductiveUnit[]): any[] {
  return units.map(unit => JSON.parse(JSON.stringify({
    id: unit.id,
    name: unit.name,
    address: unit.address,
    description: unit.description,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
    deletedAt: unit.deletedAt,
  })));
}

export interface CreateProductiveUnitInput {
  name: string;
  address?: string;
  description?: string;
}

export interface UpdateProductiveUnitInput {
  id: string;
  name?: string;
  address?: string;
  description?: string;
}

export interface GetProductiveUnitsFilters {
  name?: string;
  address?: string;
  description?: string;
  limit?: number;
  offset?: number;
}

export interface ProductiveUnitsGridFilters {
  fields?: string; // "id,name,address" - campos solicitados
  page?: number;
  limit?: number;
  search?: string; // búsqueda global
  filtration?: boolean; // ¿activar filtros por columna?
  filters?: string; // "name-Juan,address-Santiago"
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

export interface ProductiveUnitsGridResponse {
  data: ProductiveUnit[];
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
}

export interface ProductiveUnitResult {
  success: boolean;
  message?: string;
  data?: ProductiveUnit | ProductiveUnit[] | null;
  error?: string;
}

/**
 * Helper function to log audit for productive units
 * Uses Chile timezone (America/Santiago) for consistent timestamp handling
 */
async function logProductiveUnitAudit(
  manager: EntityManager,
  entityId: string,
  action: AuditActionType,
  userId: string | undefined,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>
) {
  try {
    console.log('[logProductiveUnitAudit] Iniciando registro de auditoría. userId:', userId, 'action:', action);

    const crypto = require('crypto');
    const auditId = crypto.randomUUID();

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
      entityName: 'ProductiveUnit',
      entityId: entityId,
      userId: userId,
      action: action,
      description: `${action} productive unit ${entityId}`,
      oldValues: oldValues,
      newValues: newValues,
      changes: changeCount > 0 ? fields : undefined,
      createdAt: new Date(moment.tz(APP_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')), // Use Chile timezone for consistent timestamp
    });

    await manager.save(Audit, audit);
    console.log('[logProductiveUnitAudit] Auditoría registrada exitosamente');
  } catch (error) {
    console.error('[logProductiveUnitAudit] Error al registrar auditoría:', error);
    // No fallar la operación principal por error de auditoría
  }
}

/**
 * Campos permitidos para solicitar
 */
const VALID_FIELDS = ['id', 'name', 'address', 'description', 'createdAt', 'updatedAt'];

/**
 * Campos permitidos para ordenamiento
 */
const VALID_SORT_FIELDS = ['id', 'name', 'address', 'description', 'createdAt', 'updatedAt'];

/**
 * Normaliza string para búsqueda sin acentos
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remueve acentos
    .replace(/ñ/g, 'n');
}

/**
 * Parsea filtros por columna desde formato "col1-val1,col2-val2"
 */
function parseColumnFilters(
  filtersString: string,
  allowedFields: string[]
): Array<{ column: string; value: string }> {
  return filtersString
    .split(',')
    .map(f => f.trim())
    .filter(f => f.includes('-'))
    .map(f => {
      const dashIndex = f.indexOf('-');
      return {
        column: f.substring(0, dashIndex).trim(),
        value: decodeURIComponent(f.substring(dashIndex + 1).trim())
      };
    })
    .filter(f => f.column && f.value && allowedFields.includes(f.column));
}

/**
 * READ - Obtener unidades productivas con paginación, filtros y ordenamiento para DataGrid
 */
export async function getProductiveUnitsGridData(
  filters?: ProductiveUnitsGridFilters
): Promise<ProductiveUnitsGridResponse> {
  try {
    const startTime = Date.now();
    const dataSource = await getDb();

    // --- Validar y normalizar campos solicitados ---
    const requestedFields = filters?.fields
      ? filters.fields.split(',').map(f => f.trim()).filter(f => VALID_FIELDS.includes(f))
      : VALID_FIELDS;

    if (requestedFields.length === 0) {
      return {
        data: [],
        total: 0,
        pages: 0,
        currentPage: 1,
        limit: 25,
      };
    }

    // --- Normalizar parámetros de paginación ---
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(Math.max(5, filters?.limit || 25), 100);
    const sortBy = filters?.sortBy || 'name';
    const sortOrder = (filters?.sortOrder || 'ASC').toUpperCase() as 'ASC' | 'DESC';

    // --- Validar sortBy para evitar SQL injection ---
    const safeSortBy = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : 'name';

    // --- Construir query base ---
    let query = dataSource
      .getRepository(ProductiveUnit)
      .createQueryBuilder('unit')
      .select(requestedFields.map(f => `unit.${f}`))
      .where('unit.deletedAt IS NULL');

    // --- Aplicar filtros por columna ---
    if (filters?.filtration && filters?.filters) {
      const columnFilters = parseColumnFilters(filters.filters, VALID_FIELDS);
      
      columnFilters.forEach((filter, index) => {
        const normalizedValue = normalizeString(filter.value);
        const paramName = `colFilter${index}`;
        
        // Usar REPLACE anidado para normalizar en SQL
        query = query.andWhere(
          `LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(unit.${filter.column}, ''), 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u')) LIKE :${paramName}`,
          { [paramName]: `%${normalizedValue}%` }
        );
      });
    }

    // --- Aplicar búsqueda global ---
    if (filters?.search?.trim()) {
      const normalizedSearch = normalizeString(filters.search.trim());
      
      query = query.andWhere(
        `(
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(unit.name, ''), 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u')) LIKE :search OR
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(unit.address, ''), 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u')) LIKE :search OR
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(unit.description, ''), 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u')) LIKE :search
        )`,
        { search: `%${normalizedSearch}%` }
      );
    }

    // --- Ejecutar count y data en paralelo usando clone() ---
    const [total, data] = await Promise.all([
      query.getCount(),
      query
        .clone()
        .orderBy(`unit.${safeSortBy}`, sortOrder)
        .skip((page - 1) * limit)
        .take(limit)
        .getMany(),
    ]);

    const pages = Math.ceil(total / limit);

    // --- Serializar datos ---
    const serializedData = serializeProductiveUnits(data);

    const duration = Date.now() - startTime;
    console.log(`[getProductiveUnitsGridData] Tiempo: ${duration}ms, Total: ${total} registros, Página: ${page}/${pages}`);

    return {
      data: serializedData,
      total,
      pages,
      currentPage: page,
      limit,
    };
  } catch (error) {
    console.error('[getProductiveUnitsGridData] Error:', error);
    return {
      data: [],
      total: 0,
      pages: 0,
      currentPage: 1,
      limit: 10,
    };
  }
}

/**
 * READ - Obtener todas las unidades productivas con filtros opcionales
 */
export async function getProductiveUnits(filters?: GetProductiveUnitsFilters): Promise<ProductiveUnitResult> {
  try {
    const db = await getDb();
    const repo = db.getRepository(ProductiveUnit);

    const where: any = {};

    // Aplicar filtros con homologación a minúsculas
    if (filters?.name?.trim()) {
      where.name = Like(`%${filters.name.trim().toLowerCase()}%`);
    }

    if (filters?.address?.trim()) {
      where.address = Like(`%${filters.address.trim().toLowerCase()}%`);
    }

    if (filters?.description?.trim()) {
      where.description = Like(`%${filters.description.trim().toLowerCase()}%`);
    }

    // Excluir registros soft-deleted
    where.deletedAt = IsNull();

    const productiveUnit = await repo.find({
      where,
      order: { name: 'ASC' }
    });

    return {
      success: true,
      data: serializeProductiveUnits(productiveUnit),
    };
  } catch (error: any) {
    console.error('[getProductiveUnits] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al obtener unidades productivas',
      data: [],
    };
  }
}

/**
 * READ - Obtener una unidad productiva por ID
 */
export async function getProductiveUnitById(id: string): Promise<ProductiveUnitResult> {
  try {
    if (!id || id.trim() === '') {
      return { success: false, error: 'ID inválido', data: null };
    }

    const db = await getDb();
    const productiveUnit = await db.getRepository(ProductiveUnit).findOne({
      where: { id, deletedAt: IsNull() }
    });

    if (!productiveUnit) {
      return { success: false, error: 'Unidad productiva no encontrada', data: null };
    }

    return {
      success: true,
      data: productiveUnit,
    };
  } catch (error: any) {
    console.error('[getProductiveUnitById] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al obtener la unidad productiva',
      data: null,
    };
  }
}

/**
 * CREATE - Crear una nueva unidad productiva
 */
export async function createProductiveUnit(data: CreateProductiveUnitInput, auditUserId?: string): Promise<ProductiveUnitResult> {
  try {
    // Validaciones
    if (!data.name?.trim()) {
      return { success: false, error: 'El nombre es requerido' };
    }

    if (data.name.trim().length > 255) {
      return { success: false, error: 'El nombre no puede tener más de 255 caracteres' };
    }

    if (data.address && data.address.length > 255) {
      return { success: false, error: 'La dirección no puede tener más de 255 caracteres' };
    }

    if (data.description && data.description.length > 255) {
      return { success: false, error: 'La descripción no puede tener más de 255 caracteres' };
    }

    const db = await getDb();

    // Verificar que no exista una unidad productiva con el mismo nombre (case insensitive)
    const existingUnit = await db.getRepository(ProductiveUnit).findOne({
      where: {
        name: Like(data.name.trim()),
        deletedAt: IsNull()
      }
    });

    if (existingUnit) {
      return { success: false, error: 'Ya existe una unidad productiva con ese nombre' };
    }

    // Obtener userId para auditoría si no se proporcionó
    let userId = auditUserId;
    if (!userId) {
      try {
        const { userId: sessionUserId } = await getCurrentUserSession();
        userId = sessionUserId;
      } catch (error) {
        console.warn('[createProductiveUnit] No se pudo obtener la sesión del usuario para auditoría');
      }
    }

    const unitData = {
      name: data.name.trim(),
      address: data.address?.trim() || null,
      description: data.description?.trim() || null,
    };

    const result = await db.transaction(async (manager) => {
      const unit = manager.create(ProductiveUnit, unitData);
      const savedUnit = await manager.save(ProductiveUnit, unit);

      // Registrar auditoría
      await logProductiveUnitAudit(
        manager,
        savedUnit.id,
        AuditActionType.CREATE,
        userId,
        undefined,
        unitData
      );

      return savedUnit;
    });

    revalidatePath('/home/productive-units');

    return {
      success: true,
      message: 'Unidad productiva creada exitosamente',
      data: result ? serializeProductiveUnit(result) : null,
    };
  } catch (error: any) {
    console.error('[createProductiveUnit] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al crear la unidad productiva',
    };
  }
}

/**
 * UPDATE - Actualizar una unidad productiva existente
 */
export async function updateProductiveUnit(data: UpdateProductiveUnitInput, auditUserId?: string): Promise<ProductiveUnitResult> {
  try {
    if (!data.id || data.id.trim() === '') {
      return { success: false, error: 'ID inválido' };
    }

    const db = await getDb();

    // Obtener la unidad productiva actual
    const existingUnit = await db.getRepository(ProductiveUnit).findOne({
      where: { id: data.id, deletedAt: IsNull() }
    });

    if (!existingUnit) {
      return { success: false, error: 'Unidad productiva no encontrada' };
    }

    // Validaciones
    const updates: Partial<ProductiveUnit> = {};

    if (data.name !== undefined) {
      if (!data.name.trim()) {
        return { success: false, error: 'El nombre es requerido' };
      }

      if (data.name.trim().length > 255) {
        return { success: false, error: 'El nombre no puede tener más de 255 caracteres' };
      }

      // Verificar que no exista otra unidad productiva con el mismo nombre (case insensitive)
      const duplicateUnit = await db.getRepository(ProductiveUnit).findOne({
        where: {
          name: Like(data.name.trim()),
          deletedAt: IsNull(),
          id: data.id // Excluir el registro actual
        }
      });

      if (duplicateUnit) {
        return { success: false, error: 'Ya existe otra unidad productiva con ese nombre' };
      }

      updates.name = data.name.trim();
    }

    if (data.address !== undefined) {
      if (data.address && data.address.length > 255) {
        return { success: false, error: 'La dirección no puede tener más de 255 caracteres' };
      }

      updates.address = data.address?.trim() || null;
    }

    if (data.description !== undefined) {
      if (data.description && data.description.length > 255) {
        return { success: false, error: 'La descripción no puede tener más de 255 caracteres' };
      }

      updates.description = data.description?.trim() || null;
    }

    // Verificar que haya cambios
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
        console.warn('[updateProductiveUnit] No se pudo obtener la sesión del usuario para auditoría');
      }
    }

    const oldValues = {
      name: existingUnit.name,
      address: existingUnit.address,
      description: existingUnit.description,
    };

    const result = await db.transaction(async (manager) => {
      await manager.update(ProductiveUnit, data.id, updates);

      const updatedUnit = await manager.findOne(ProductiveUnit, {
        where: { id: data.id }
      });

      // Registrar auditoría
      await logProductiveUnitAudit(
        manager,
        data.id,
        AuditActionType.UPDATE,
        userId,
        oldValues,
        updates
      );

      return updatedUnit;
    });

    revalidatePath('/home/productive-units');

    return {
      success: true,
      message: 'Unidad productiva actualizada exitosamente',
      data: result ? serializeProductiveUnit(result) : null,
    };
  } catch (error: any) {
    console.error('[updateProductiveUnit] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al actualizar la unidad productiva',
    };
  }
}

/**
 * DELETE - Eliminar una unidad productiva (soft delete)
 */
export async function deleteProductiveUnit(id: string, auditUserId?: string): Promise<ProductiveUnitResult> {
  try {
    if (!id || id.trim() === '') {
      return { success: false, error: 'ID inválido' };
    }

    const db = await getDb();

    // Obtener la unidad productiva actual
    const existingUnit = await db.getRepository(ProductiveUnit).findOne({
      where: { id, deletedAt: IsNull() }
    });

    if (!existingUnit) {
      return { success: false, error: 'Unidad productiva no encontrada' };
    }

    // Obtener userId para auditoría si no se proporcionó
    let userId = auditUserId;
    if (!userId) {
      try {
        const { userId: sessionUserId } = await getCurrentUserSession();
        userId = sessionUserId;
      } catch (error) {
        console.warn('[deleteProductiveUnit] No se pudo obtener la sesión del usuario para auditoría');
      }
    }

    const oldValues = {
      name: existingUnit.name,
      address: existingUnit.address,
      description: existingUnit.description,
    };

    const result = await db.transaction(async (manager) => {
      // Soft delete
      await manager.update(ProductiveUnit, id, {
        deletedAt: new Date(),
      });

      // Registrar auditoría
      await logProductiveUnitAudit(
        manager,
        id,
        AuditActionType.DELETE,
        userId,
        oldValues,
        undefined
      );

      return existingUnit;
    });

    revalidatePath('/home/productive-units');

    return {
      success: true,
      message: 'Unidad productiva eliminada exitosamente',
      data: result ? serializeProductiveUnit(result) : null,
    };
  } catch (error: any) {
    console.error('[deleteProductiveUnit] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al eliminar la unidad productiva',
    };
  }
}

/**
 * Server action para obtener datos de unidades productivas para exportar a Excel
 * Retorna los datos sin formatear XLSX (eso se hace en el cliente)
 */
export async function getProductiveUnitsExportData(filters?: ProductiveUnitsGridFilters): Promise<{
  success: boolean;
  data?: any[];
  recordCount?: number;
  error?: string;
}> {
  try {
    const dataSource = await getDb();
    const maxRows = 10000;

    // Normalizar parámetros (sin paginación)
    const sortBy = filters?.sortBy || 'name';
    const sortOrder = (filters?.sortOrder || 'ASC').toUpperCase() as 'ASC' | 'DESC';

    // Validar sortBy
    const safeSortBy = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : 'name';

    // Construir query base
    let query = dataSource
      .getRepository(ProductiveUnit)
      .createQueryBuilder('unit')
      .select([
        'unit.id',
        'unit.name',
        'unit.address',
        'unit.description',
        'unit.createdAt',
        'unit.updatedAt',
      ])
      .where('unit.deletedAt IS NULL');

    // Aplicar filtros por columna
    if (filters?.filtration && filters?.filters) {
      const columnFilters = parseColumnFilters(filters.filters, VALID_FIELDS);

      columnFilters.forEach(({ column, value }) => {
        const normalizedValue = normalizeString(value);

        // Usar REPLACE para normalizar y comparar sin acentos
        query = query.andWhere(
          `LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(unit.${column}, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u')) LIKE :${column}Value`,
          { [`${column}Value`]: `%${normalizedValue}%` }
        );
      });
    }

    // Aplicar búsqueda global
    if (filters?.search && filters.search.trim() !== '') {
      const normalizedSearch = normalizeString(filters.search);

      query = query.andWhere(
        `(
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(unit.name, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u')) LIKE :globalSearch OR
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(unit.address, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u')) LIKE :globalSearch OR
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(unit.description, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u')) LIKE :globalSearch
        )`,
        { globalSearch: `%${normalizedSearch}%` }
      );
    }

    // Obtener todos los registros (limitado a maxRows)
    const allUnits = await query
      .orderBy(`unit.${safeSortBy}`, sortOrder)
      .take(maxRows + 1) // Obtener uno más para detectar si hay más
      .getMany();

    // Validar límite
    if (allUnits.length > maxRows) {
      return {
        success: false,
        error: `Total de registros (${allUnits.length}) excede el límite permitido de ${maxRows}. Refine los filtros.`,
      };
    }

    // Serializar datos (remover proxies de TypeORM)
    const serializedData = JSON.parse(JSON.stringify(allUnits));

    console.log(`[getProductiveUnitsExportData] Exportando ${serializedData.length} registros`);

    return {
      success: true,
      data: serializedData,
      recordCount: serializedData.length,
    };
  } catch (error) {
    console.error('[getProductiveUnitsExportData] Error:', error);
    return {
      success: false,
      error: `Error al obtener datos: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * READ - Lista simple de unidades productivas para autocomplete
 * Retorna solo id y nombre de unidades activas, ordenadas alfabéticamente
 */
export async function getProductiveUnitsSimpleList(): Promise<Array<{ id: string; name: string }>> {
  try {
    const dataSource = await getDb();

    const units = await dataSource
      .getRepository(ProductiveUnit)
      .createQueryBuilder('unit')
      .select(['unit.id', 'unit.name'])
      .where('unit.deletedAt IS NULL')
      .orderBy('unit.name', 'ASC')
      .getMany();

    return units.map(unit => ({
      id: unit.id,
      name: unit.name
    }));
  } catch (error) {
    console.error('[getProductiveUnitsSimpleList] Error:', error);
    return [];
  }
}