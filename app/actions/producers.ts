'use server';

import { Producer } from '../../data/entities/Producer';
import { Person, AccountTypeName, BankName, type PersonBankAccount } from '../../data/entities/Person';
import { ProductiveUnit } from '../../data/entities/ProductiveUnit';
import { Audit } from '../../data/entities/Audit';
import { AuditActionType } from '../../data/entities/audit.types';
import { getDb } from '../../data/db';
import moment from 'moment-timezone';
import { revalidatePath } from 'next/cache';
import { getCurrentUserSession } from './auth.server';
import { EntityManager, IsNull } from 'typeorm';

const APP_TIMEZONE = 'America/Santiago';
const VALID_FIELDS = ['name', 'dni', 'mail', 'phone', 'productiveUnitId'];
const VALID_SORT_FIELDS = ['name', 'dni', 'mail', 'phone', 'createdAt', 'updatedAt'];

/**
 * Normalize string for search (remove accents, convert to lowercase)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Parse column filters from string format
 */
function parseColumnFilters(filterStr?: string): Record<string, string> {
  if (!filterStr) return {};
  
  const filters: Record<string, string> = {};
  const parts = filterStr.split(',');
  
  for (const part of parts) {
    const [key, ...valueParts] = part.split('-');
    if (key && valueParts.length > 0) {
      filters[key.trim()] = decodeURIComponent(valueParts.join('-').trim());
    }
  }
  
  return filters;
}

/**
 * Serialize producer for transmission
 */
function serializeProducer(producer: Producer): any {
  return JSON.parse(JSON.stringify({
    id: producer.id,
    name: producer.name,
    dni: producer.dni,
    mail: producer.mail,
    phone: producer.phone,
    productiveUnitId: producer.productiveUnitId,
    productiveUnit: producer.productiveUnit,
    person: producer.person,
    createdAt: producer.createdAt,
    updatedAt: producer.updatedAt,
    deletedAt: producer.deletedAt,
  }));
}

/**
 * Serialize producers array
 */
function serializeProducers(producers: Producer[]): any[] {
  return producers.map(serializeProducer);
}

const allowedAccountTypes = new Set<string>(Object.values(AccountTypeName));
const allowedBankNames = new Set<string>(Object.values(BankName));

function sanitizeBankAccounts(input?: PersonBankAccount[] | null): PersonBankAccount[] | undefined {
  if (!Array.isArray(input)) {
    return undefined;
  }

  const sanitizedAccounts: PersonBankAccount[] = [];

  for (const rawAccount of input) {
    if (!rawAccount) {
      continue;
    }

    const accountTypeRaw = typeof rawAccount.accountType === 'string' ? rawAccount.accountType.trim() : '';
    const bankRaw = typeof rawAccount.bank === 'string' ? rawAccount.bank.trim() : '';
    const accountNumber = typeof rawAccount.accountNumber === 'string' ? rawAccount.accountNumber.trim() : '';

    if (!accountTypeRaw || !bankRaw || !accountNumber) {
      continue;
    }

    if (!allowedAccountTypes.has(accountTypeRaw) || !allowedBankNames.has(bankRaw)) {
      continue;
    }

    const sanitizedAccount: PersonBankAccount = {
      accountType: accountTypeRaw as AccountTypeName,
      bank: bankRaw as BankName,
      accountNumber,
    };

    if (typeof rawAccount.alias === 'string') {
      const alias = rawAccount.alias.trim();
      if (alias) {
        sanitizedAccount.alias = alias;
      }
    }

    if (rawAccount.isPrimary !== undefined) {
      sanitizedAccount.isPrimary = Boolean(rawAccount.isPrimary);
    }

    sanitizedAccounts.push(sanitizedAccount);
  }

  return sanitizedAccounts.length > 0 ? sanitizedAccounts : undefined;
}

export interface CreateProducerInput {
  name: string;
  dni: string;
  mail?: string;
  phone?: string;
  productiveUnitId: string;
  bankAccounts?: PersonBankAccount[];
}

export interface UpdateProducerInput {
  id: string;
  name?: string;
  dni?: string;
  mail?: string;
  phone?: string;
  productiveUnitId?: string;
}

export interface GetProducersGridDataInput {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  columnFilters?: string;
  productiveUnitId?: string;
}

export interface ProducerGridData {
  id: string;
  name: string;
  dni: string;
  mail: string;
  phone: string;
  productiveUnitId: string;
  productiveUnit?: any;
  person?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface GridResponse {
  success: boolean;
  data: ProducerGridData[];
  totalRecords: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

export interface ProducerResult {
  success: boolean;
  message?: string;
  data?: Producer | Producer[] | null;
  error?: string;
}

/**
 * Audit logging helper for producers
 */
async function logProducerAudit(
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
        if (oldValues[key] !== newValues[key]) {
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
      entityName: 'Producer',
      entityId: entityId,
      userId: userId,
      action: action,
      description: `${action} producer ${entityId}`,
      oldValues: oldValues,
      newValues: newValues,
      changes: changeCount > 0 ? fields : undefined,
      createdAt: new Date(moment.tz(APP_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')),
    });

    await manager.save(Audit, audit);
  } catch (error) {
    console.error('[logProducerAudit] Error:', error);
  }
}

/**
 * Get producers grid data with filters, search, and pagination
 */
export async function getProducersGridData(input: GetProducersGridDataInput): Promise<GridResponse> {
  try {
    const page = Math.max(1, input.page || 1);
    const limit = Math.min(100, Math.max(1, input.limit || 25));
    const sortBy = VALID_SORT_FIELDS.includes(input.sortBy || '') ? input.sortBy : 'createdAt';
    const sortOrder = input.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const db = await getDb();
    const query = db.createQueryBuilder(Producer, 'producer')
      .leftJoinAndSelect('producer.productiveUnit', 'productiveUnit', 'productiveUnit.deletedAt IS NULL')
      .where('producer.deletedAt IS NULL');

    // Apply search
    if (input.search?.trim()) {
      const searchTerm = normalizeString(input.search.trim());
      query.andWhere(
        `(LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONCAT(producer.name, producer.dni, producer.mail, producer.phone, productiveUnit.name), 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'), 'ñ', 'n')) LIKE :search)`,
        { search: `%${searchTerm}%` }
      );
    }

    // Apply column filters
    const columnFilters = parseColumnFilters(input.columnFilters);
    for (const [field, value] of Object.entries(columnFilters)) {
      if (VALID_FIELDS.includes(field)) {
        const normalizedValue = normalizeString(value);
        query.andWhere(
          `LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(producer.${field}, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'), 'ñ', 'n')) LIKE :${field}`,
          { [field]: `%${normalizedValue}%` }
        );
      }
    }

    // Apply productive unit filter
    if (input.productiveUnitId?.trim()) {
      query.andWhere('producer.productiveUnitId = :productiveUnitId', {
        productiveUnitId: input.productiveUnitId.trim()
      });
    }

    // Count total
    const totalRecords = await query.getCount();
    const totalPages = Math.ceil(totalRecords / limit);

    // Apply sort and pagination
    query.orderBy(`producer.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const producers = await query.getMany();

    return {
      success: true,
      data: serializeProducers(producers),
      totalRecords,
      page,
      limit,
      totalPages,
    };
  } catch (error: any) {
    console.error('[getProducersGridData] Error:', error);
    return {
      success: false,
      data: [],
      totalRecords: 0,
      page: 1,
      limit: 25,
      totalPages: 0,
      error: error?.message || 'Error fetching producers',
    };
  }
}

/**
 * Get producers data for export (up to 10,000 records)
 */
export async function getProducersExportData(input: GetProducersGridDataInput): Promise<GridResponse> {
  try {
    const limit = 10000;
    const sortBy = VALID_SORT_FIELDS.includes(input.sortBy || '') ? input.sortBy : 'createdAt';
    const sortOrder = input.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const db = await getDb();
    const query = db.createQueryBuilder(Producer, 'producer')
      .leftJoinAndSelect('producer.productiveUnit', 'productiveUnit', 'productiveUnit.deletedAt IS NULL')
      .where('producer.deletedAt IS NULL');

    // Apply search
    if (input.search?.trim()) {
      const searchTerm = normalizeString(input.search.trim());
      query.andWhere(
        `(LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONCAT(producer.name, producer.dni, producer.mail, producer.phone, productiveUnit.name), 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'), 'ñ', 'n')) LIKE :search)`,
        { search: `%${searchTerm}%` }
      );
    }

    // Apply column filters
    const columnFilters = parseColumnFilters(input.columnFilters);
    for (const [field, value] of Object.entries(columnFilters)) {
      if (VALID_FIELDS.includes(field)) {
        const normalizedValue = normalizeString(value);
        query.andWhere(
          `LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(producer.${field}, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'), 'ñ', 'n')) LIKE :${field}`,
          { [field]: `%${normalizedValue}%` }
        );
      }
    }

    const totalRecords = await query.getCount();

    query.orderBy(`producer.${sortBy}`, sortOrder)
      .take(limit);

    const producers = await query.getMany();

    return {
      success: true,
      data: serializeProducers(producers),
      totalRecords,
      page: 1,
      limit: limit,
      totalPages: 1,
    };
  } catch (error: any) {
    console.error('[getProducersExportData] Error:', error);
    return {
      success: false,
      data: [],
      totalRecords: 0,
      page: 1,
      limit: 10000,
      totalPages: 0,
      error: error?.message || 'Error exporting producers',
    };
  }
}

/**
 * Get simple producers list for autocomplete
 */
export async function getProducersSimpleList(): Promise<Array<{ id: string; name: string }>> {
  try {
    const db = await getDb();
    const producers = await db.getRepository(Producer)
      .find({
        where: { deletedAt: IsNull() },
        order: { name: 'ASC' },
      });

    return producers.map(p => ({ id: p.id, name: p.name }));
  } catch (error: any) {
    console.error('[getProducersSimpleList] Error:', error);
    return [];
  }
}

/**
 * Get producers simple list with label (= name + dni) for select inputs
 */
export async function getProducersSimpleListWithLabel(): Promise<Array<{ id: string; label: string }>> {
  try {
    const db = await getDb();
    const producers = await db.getRepository(Producer).find({ where: { deletedAt: IsNull() }, order: { name: 'ASC' } });
    return producers.map(p => ({ id: p.id, label: `${p.name} - ${p.dni}` }));
  } catch (error: any) {
    console.error('[getProducersSimpleListWithLabel] Error:', error);
    return [];
  }
}

/**
 * Create producer
 */
export async function createProducer(input: CreateProducerInput, auditUserId?: string): Promise<ProducerResult> {
  try {
    if (!input.name?.trim()) {
      return { success: false, error: 'Name is required' };
    }
    if (!input.dni?.trim()) {
      return { success: false, error: 'DNI is required' };
    }
    if (!input.productiveUnitId?.trim()) {
      return { success: false, error: 'Productive unit is required' };
    }

    const db = await getDb();

    // Verify productive unit exists
    const unitExists = await db.getRepository(ProductiveUnit).findOne({
      where: { id: input.productiveUnitId, deletedAt: IsNull() }
    });

    if (!unitExists) {
      return { success: false, error: 'Productive unit not found' };
    }

    // Check duplicate DNI in Producer table
    const existingProducer = await db.getRepository(Producer).findOne({
      where: { dni: input.dni.trim(), deletedAt: IsNull() }
    });

    if (existingProducer) {
      return { success: false, error: 'Producer with this DNI already exists' };
    }

    let userId = auditUserId;
    if (!userId) {
      try {
        const { userId: sessionUserId } = await getCurrentUserSession();
        userId = sessionUserId;
      } catch (error) {
        console.warn('[createProducer] Could not get user session for audit');
      }
    }

    const sanitizedBankAccounts = sanitizeBankAccounts(input.bankAccounts);

    const result = await db.transaction(async (manager) => {
      const personData: Partial<Person> = {
        name: input.name.trim(),
        dni: input.dni.trim(),
        mail: input.mail?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        bankAccounts: sanitizedBankAccounts ?? null,
      };

      const person = manager.create(Person, personData);

      const savedPerson = await manager.save(Person, person);

      // Create Producer record with all fields
      const producerEntityData: Partial<Producer> = {
        name: input.name.trim(),
        dni: input.dni.trim(),
        mail: input.mail?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        productiveUnitId: input.productiveUnitId.trim(),
        personId: savedPerson.id,
        person: savedPerson,
      };

      const producer = manager.create(Producer, producerEntityData);

      const savedProducer = await manager.save(Producer, producer);
      savedProducer.person = savedPerson;

      // Audit log
      const auditProducerData = {
        name: input.name.trim(),
        dni: input.dni.trim(),
        mail: input.mail?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        productiveUnitId: input.productiveUnitId.trim(),
        bankAccounts: sanitizedBankAccounts ?? null,
      };

      await logProducerAudit(
        manager,
        savedProducer.id,
        AuditActionType.CREATE,
        userId,
        undefined,
        auditProducerData
      );

      return savedProducer;
    });

    revalidatePath('/home/productiveManagement/producers');

    return {
      success: true,
      message: 'Producer created successfully',
      data: result ? serializeProducer(result) : null,
    };
  } catch (error: any) {
    console.error('[createProducer] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error creating producer',
    };
  }
}

/**
 * Update producer
 */
export async function updateProducer(input: UpdateProducerInput, auditUserId?: string): Promise<ProducerResult> {
  try {
    if (!input.id?.trim()) {
      return { success: false, error: 'ID is required' };
    }

    const db = await getDb();

    const existingProducer = await db.getRepository(Producer).findOne({
      where: { id: input.id, deletedAt: IsNull() },
      relations: ['productiveUnit']
    });

    if (!existingProducer) {
      return { success: false, error: 'Producer not found' };
    }

    const producerUpdates: Partial<Producer> = {};

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        return { success: false, error: 'Name is required' };
      }
      producerUpdates.name = input.name.trim();
    }

    if (input.dni !== undefined) {
      if (!input.dni.trim()) {
        return { success: false, error: 'DNI is required' };
      }
      // Check duplicate DNI (excluding current producer)
      const duplicateProducer = await db.getRepository(Producer).findOne({
        where: {
          dni: input.dni.trim(),
          deletedAt: IsNull(),
        }
      });
      if (duplicateProducer && duplicateProducer.id !== input.id) {
        return { success: false, error: 'Producer with this DNI already exists' };
      }
      producerUpdates.dni = input.dni.trim();
    }

    if (input.mail !== undefined) {
      producerUpdates.mail = input.mail?.trim() || undefined;
    }

    if (input.phone !== undefined) {
      producerUpdates.phone = input.phone?.trim() || undefined;
    }

    if (input.productiveUnitId !== undefined) {
      if (!input.productiveUnitId.trim()) {
        return { success: false, error: 'Productive unit is required' };
      }
      const unitExists = await db.getRepository(ProductiveUnit).findOne({
        where: { id: input.productiveUnitId, deletedAt: IsNull() }
      });
      if (!unitExists) {
        return { success: false, error: 'Productive unit not found' };
      }
      producerUpdates.productiveUnitId = input.productiveUnitId.trim();
    }

    if (Object.keys(producerUpdates).length === 0) {
      return { success: false, error: 'No changes detected' };
    }

    let userId = auditUserId;
    if (!userId) {
      try {
        const { userId: sessionUserId } = await getCurrentUserSession();
        userId = sessionUserId;
      } catch (error) {
        console.warn('[updateProducer] Could not get user session for audit');
      }
    }

    const oldValues = {
      name: existingProducer.name,
      dni: existingProducer.dni,
      mail: existingProducer.mail,
      phone: existingProducer.phone,
      productiveUnitId: existingProducer.productiveUnitId,
    };

    const newValues = {
      name: producerUpdates.name || existingProducer.name,
      dni: producerUpdates.dni || existingProducer.dni,
      mail: producerUpdates.mail || existingProducer.mail,
      phone: producerUpdates.phone || existingProducer.phone,
      productiveUnitId: producerUpdates.productiveUnitId || existingProducer.productiveUnitId,
    };

    const result = await db.transaction(async (manager) => {
      // Update Producer
      await manager.update(Producer, input.id, producerUpdates);

      const updatedProducer = await manager.findOne(Producer, {
        where: { id: input.id },
        relations: ['productiveUnit']
      });

      await logProducerAudit(
        manager,
        input.id,
        AuditActionType.UPDATE,
        userId,
        oldValues,
        newValues
      );

      return updatedProducer;
    });

    revalidatePath('/home/productiveManagement/producers');

    return {
      success: true,
      message: 'Producer updated successfully',
      data: result ? serializeProducer(result) : null,
    };
  } catch (error: any) {
    console.error('[updateProducer] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error updating producer',
    };
  }
}

/**
 * Delete producer
 */
export async function deleteProducer(id: string, auditUserId?: string): Promise<ProducerResult> {
  try {
    if (!id?.trim()) {
      return { success: false, error: 'ID is required' };
    }

    const db = await getDb();

    const existingProducer = await db.getRepository(Producer).findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['productiveUnit']
    });

    if (!existingProducer) {
      return { success: false, error: 'Producer not found' };
    }

    const oldValues = {
      name: existingProducer.name,
      dni: existingProducer.dni,
      mail: existingProducer.mail,
      phone: existingProducer.phone,
      productiveUnitId: existingProducer.productiveUnitId,
    };

    let userId = auditUserId;
    if (!userId) {
      try {
        const { userId: sessionUserId } = await getCurrentUserSession();
        userId = sessionUserId;
      } catch (error) {
        console.warn('[deleteProducer] Could not get user session for audit');
      }
    }

    const result = await db.transaction(async (manager) => {
      await manager.update(Producer, id, {
        deletedAt: new Date(),
      });

      await logProducerAudit(
        manager,
        id,
        AuditActionType.DELETE,
        userId,
        oldValues,
        undefined
      );

      return existingProducer;
    });

    revalidatePath('/home/productiveManagement/producers');

    return {
      success: true,
      message: 'Producer deleted successfully',
      data: result ? serializeProducer(result) : null,
    };
  } catch (error: any) {
    console.error('[deleteProducer] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error deleting producer',
    };
  }
}