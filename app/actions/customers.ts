// Server Actions para CRUD de la entidad Customer
'use server';

import { Customer } from '../../data/entities/Customer';
import { Person } from '../../data/entities/Person';
import { Audit } from '../../data/entities/Audit';
import { AuditActionType } from '../../data/entities/audit.types';
import { getDb } from '../../data/db';
import moment from 'moment-timezone';
import { revalidatePath } from 'next/cache';
import { getCurrentUserSession } from './auth.server';
import { EntityManager, IsNull, SelectQueryBuilder } from 'typeorm';
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

const APP_TIMEZONE = 'America/Santiago';

/**
 * Convierte una entidad Customer a un objeto plano serializable
 */
function serializeCustomer(customer: Customer): any {
  return JSON.parse(JSON.stringify({
    id: customer.id,
    personId: customer.personId,
    name: customer.person?.name ?? '',
    dni: customer.person?.dni ?? '',
    mail: customer.person?.mail ?? '',
    phone: customer.person?.phone ?? '',
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    deletedAt: customer.deletedAt,
  }));
}

/**
 * Convierte un array de entidades Customer a objetos planos serializables
 */
function serializeCustomers(customers: Customer[]): any[] {
  return customers.map((customer) => serializeCustomer(customer));
}

export interface CreateCustomerInput {
  personId: string;
}

export interface CreateCustomerWithPersonInput {
  name: string;
  dni: string;
  mail?: string;
  phone?: string;
}

export interface UpdateCustomerInput {
  id: string;
  personId?: string;
}

export interface UpdateCustomerWithPersonInput {
  id: string;
  name?: string;
  dni?: string;
  mail?: string;
  phone?: string;
}

export interface GetCustomersFilters {
  personId?: string;
}

export interface CustomerResult {
  success: boolean;
  message?: string;
  data?: Customer | Customer[] | null;
  error?: string;
}

export interface GetCustomersGridDataInput {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  columnFilters?: string;
  filtration?: boolean;
}

export interface CustomerGridRow {
  id: string;
  personId: string;
  name: string;
  dni: string;
  mail: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomersGridResponse {
  success: boolean;
  data: CustomerGridRow[];
  totalRecords: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

const CUSTOMER_COLUMN_FIELDS = ['name', 'dni', 'mail', 'phone'];
const CUSTOMER_FILTERABLE_FIELDS = [...CUSTOMER_COLUMN_FIELDS];
const CUSTOMER_SORT_FIELDS = ['name', 'dni', 'mail', 'phone', 'createdAt', 'updatedAt'];

function shouldApplyCustomerColumnFilters(input: GetCustomersGridDataInput): boolean {
  return input.filtration === true || Boolean(input.columnFilters?.trim());
}

function applyCustomersGridFilters(
  query: SelectQueryBuilder<Customer>,
  input: GetCustomersGridDataInput,
): void {
  if (input.search?.trim()) {
    applyTextSearch(query, {
      columns: ['person.name', 'person.dni', 'person.mail', 'person.phone'],
      search: input.search,
      paramName: 'customerSearch',
    });
  }

  if (shouldApplyCustomerColumnFilters(input) && input.columnFilters) {
    const columnFilters = parseColumnFilters(input.columnFilters, CUSTOMER_FILTERABLE_FIELDS);
    columnFilters.forEach((filter, index) => {
      const paramName = `customerColFilter${index}`;
      if (CUSTOMER_COLUMN_FIELDS.includes(filter.column)) {
        query.andWhere(`${normalizeSqlExpr(`person.${filter.column}`)} LIKE :${paramName}`, {
          [paramName]: `%${normalizeString(filter.value)}%`,
        });
      }
    });
  }
}

/**
 * Helper function to log audit for customer
 * Uses Chile timezone (America/Santiago) for consistent timestamp handling
 */
async function logCustomerAudit(
  manager: EntityManager,
  entityId: string,
  action: AuditActionType,
  userId: string | undefined,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>
) {
  try {
    console.log('[logCustomerAudit] Iniciando registro de auditoría. userId:', userId, 'action:', action);

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
      entityName: 'Customer',
      entityId: entityId,
      userId: userId,
      action: action,
      description: `${action} customer ${entityId}`,
      oldValues: oldValues,
      newValues: newValues,
      changes: changeCount > 0 ? fields : undefined,
      createdAt: new Date(moment.tz(APP_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')), // Use Chile timezone for consistent timestamp
    });

    await manager.save(Audit, audit);
    console.log('[logCustomerAudit] Auditoría registrada exitosamente');
  } catch (error) {
    console.error('[logCustomerAudit] Error al registrar auditoría:', error);
    // No fallar la operación principal por error de auditoría
  }
}

export async function getCustomersGridData(
  input: GetCustomersGridDataInput = {},
): Promise<CustomersGridResponse> {
  try {
    const page = resolvePage(input.page, 1);
    const limit = resolveLimit(input.limit, 25);
    const sortBy = resolveSortField(input.sortBy, CUSTOMER_SORT_FIELDS, 'createdAt');
    const sortOrder = resolveSortOrder(input.sortOrder, 'DESC');
    const sortColumn = CUSTOMER_COLUMN_FIELDS.includes(sortBy)
      ? `person.${sortBy}`
      : `customer.${sortBy}`;

    const db = await getDb();
    const query = db
      .createQueryBuilder(Customer, 'customer')
      .leftJoinAndSelect('customer.person', 'person')
      .where('customer.deletedAt IS NULL')
      .andWhere('person.deletedAt IS NULL');

    applyCustomersGridFilters(query, input);

    const totalRecords = await query.getCount();
    const totalPages = Math.ceil(totalRecords / limit);

    const customers = await query
      .clone()
      .orderBy(sortColumn, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const data: CustomerGridRow[] = customers.map((customer) => ({
      id: customer.id,
      personId: customer.personId,
      name: customer.person?.name ?? '',
      dni: customer.person?.dni ?? '',
      mail: customer.person?.mail ?? '',
      phone: customer.person?.phone ?? '',
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    }));

    return {
      success: true,
      data,
      totalRecords,
      page,
      limit,
      totalPages,
    };
  } catch (error: any) {
    console.error('[getCustomersGridData] Error:', error);
    return {
      success: false,
      data: [],
      totalRecords: 0,
      page: 1,
      limit: 25,
      totalPages: 0,
      error: error?.message || 'Error al obtener clientes',
    };
  }
}

/**
 * READ - Obtener todos los clientes con filtros opcionales
 */
export async function getCustomers(filters?: GetCustomersFilters): Promise<CustomerResult> {
  try {
    const db = await getDb();
    const repo = db.getRepository(Customer);

    const where: any = {};

    if (filters?.personId) {
      where.personId = filters.personId;
    }

    // Excluir registros soft-deleted
    where.deletedAt = IsNull();

    const customer = await repo.find({
      where,
      relations: ['person'],
      order: { createdAt: 'DESC' }
    });

    return {
      success: true,
      data: serializeCustomers(customer),
    };
  } catch (error: any) {
    console.error('[getCustomers] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al obtener clientes',
      data: [],
    };
  }
}

export async function getCustomersSimpleListWithLabel(): Promise<Array<{ id: string; label: string }>> {
  try {
    const db = await getDb();
    const customers = await db.getRepository(Customer)
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.person', 'person')
      .where('customer.deletedAt IS NULL')
      .andWhere('person.deletedAt IS NULL')
      .orderBy('person.name', 'ASC')
      .getMany();

    return customers.map((customer) => {
      const name = customer.person?.name?.trim() || 'Cliente sin nombre';
      const dni = customer.person?.dni?.trim();
      return {
        id: customer.id,
        label: dni ? `${name} - ${dni}` : name,
      };
    });
  } catch (error: any) {
    console.error('[getCustomersSimpleListWithLabel] Error:', error);
    return [];
  }
}

/**
 * READ - Obtener un cliente por ID
 */
export async function getCustomerById(id: string): Promise<CustomerResult> {
  try {
    if (!id || id.trim() === '') {
      return { success: false, error: 'ID inválido', data: null };
    }

    const db = await getDb();
    const customer = await db.getRepository(Customer).findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['person']
    });

    if (!customer) {
      return { success: false, error: 'Cliente no encontrado', data: null };
    }

    return {
      success: true,
      data: serializeCustomer(customer),
    };
  } catch (error: any) {
    console.error('[getCustomerById] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al obtener el cliente',
      data: null,
    };
  }
}

/**
 * CREATE - Crear cliente con persona (nombre/RUT) en una sola transacción
 */
export async function createCustomerWithPerson(
  data: CreateCustomerWithPersonInput,
  auditUserId?: string,
): Promise<CustomerResult> {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: 'El nombre es requerido' };
    }
    if (!data.dni?.trim()) {
      return { success: false, error: 'El RUT es requerido' };
    }

    const db = await getDb();

    let userId = auditUserId;
    if (!userId) {
      try {
        const { userId: sessionUserId } = await getCurrentUserSession();
        userId = sessionUserId;
      } catch {
        console.warn('[createCustomerWithPerson] No se pudo obtener la sesión del usuario para auditoría');
      }
    }

    const result = await db.transaction(async (manager) => {
      const person = manager.create(Person, {
        name: data.name.trim(),
        dni: data.dni.trim(),
        mail: data.mail?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
      });
      const savedPerson = await manager.save(Person, person);

      const customer = manager.create(Customer, { personId: savedPerson.id });
      const savedCustomer = await manager.save(Customer, customer);
      savedCustomer.person = savedPerson;

      await logCustomerAudit(
        manager,
        savedCustomer.id,
        AuditActionType.CREATE,
        userId,
        undefined,
        {
          personId: savedPerson.id,
          name: savedPerson.name,
          dni: savedPerson.dni,
          mail: savedPerson.mail,
          phone: savedPerson.phone,
        },
      );

      return savedCustomer;
    });

    revalidatePath('/home/dispatch/customers');

    return {
      success: true,
      message: 'Cliente creado exitosamente',
      data: serializeCustomer(result),
    };
  } catch (error: any) {
    console.error('[createCustomerWithPerson] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al crear el cliente',
    };
  }
}

/**
 * UPDATE - Actualizar datos de persona del cliente
 */
export async function updateCustomerWithPerson(
  data: UpdateCustomerWithPersonInput,
  auditUserId?: string,
): Promise<CustomerResult> {
  try {
    if (!data.id?.trim()) {
      return { success: false, error: 'ID inválido' };
    }

    const db = await getDb();
    const existingCustomer = await db.getRepository(Customer).findOne({
      where: { id: data.id, deletedAt: IsNull() },
      relations: ['person'],
    });

    if (!existingCustomer?.person) {
      return { success: false, error: 'Cliente no encontrado' };
    }

    const personUpdates: Partial<Person> = {};
    if (data.name !== undefined) {
      if (!data.name.trim()) return { success: false, error: 'El nombre es requerido' };
      personUpdates.name = data.name.trim();
    }
    if (data.dni !== undefined) {
      if (!data.dni.trim()) return { success: false, error: 'El RUT es requerido' };
      personUpdates.dni = data.dni.trim();
    }
    if (data.mail !== undefined) {
      personUpdates.mail = data.mail.trim() || undefined;
    }
    if (data.phone !== undefined) {
      personUpdates.phone = data.phone.trim() || undefined;
    }

    if (Object.keys(personUpdates).length === 0) {
      return { success: false, error: 'No se detectaron cambios' };
    }

    let userId = auditUserId;
    if (!userId) {
      try {
        const { userId: sessionUserId } = await getCurrentUserSession();
        userId = sessionUserId;
      } catch {
        console.warn('[updateCustomerWithPerson] No se pudo obtener la sesión del usuario para auditoría');
      }
    }

    const oldValues = {
      name: existingCustomer.person.name,
      dni: existingCustomer.person.dni,
      mail: existingCustomer.person.mail,
      phone: existingCustomer.person.phone,
    };

    const result = await db.transaction(async (manager) => {
      await manager.update(Person, existingCustomer.personId, personUpdates);
      const updated = await manager.findOne(Customer, {
        where: { id: data.id },
        relations: ['person'],
      });

      await logCustomerAudit(
        manager,
        data.id,
        AuditActionType.UPDATE,
        userId,
        oldValues,
        personUpdates,
      );

      return updated;
    });

    revalidatePath('/home/dispatch/customers');

    return {
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: result ? serializeCustomer(result) : null,
    };
  } catch (error: any) {
    console.error('[updateCustomerWithPerson] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al actualizar el cliente',
    };
  }
}

/**
 * CREATE - Crear un nuevo cliente
 */
export async function createCustomer(data: CreateCustomerInput, auditUserId?: string): Promise<CustomerResult> {
  try {
    // Validaciones
    if (!data.personId?.trim()) {
      return { success: false, error: 'La persona es requerida' };
    }

    const db = await getDb();

    // Verificar que la persona existe
    const personExists = await db.getRepository('Person').findOne({
      where: { id: data.personId, deletedAt: IsNull() }
    });

    if (!personExists) {
      return { success: false, error: 'La persona especificada no existe' };
    }

    // Verificar que no exista ya un cliente con la misma persona
    const existingCustomer = await db.getRepository(Customer).findOne({
      where: {
        personId: data.personId,
        deletedAt: IsNull()
      }
    });

    if (existingCustomer) {
      return { success: false, error: 'Ya existe un cliente con esta persona' };
    }

    // Obtener userId para auditoría si no se proporcionó
    let userId = auditUserId;
    if (!userId) {
      try {
        const { userId: sessionUserId } = await getCurrentUserSession();
        userId = sessionUserId;
      } catch (error) {
        console.warn('[createCustomer] No se pudo obtener la sesión del usuario para auditoría');
      }
    }

    const customerData = {
      personId: data.personId.trim(),
    };

    const result = await db.transaction(async (manager) => {
      const customer = manager.create(Customer, customerData);
      const savedCustomer = await manager.save(Customer, customer);

      // Registrar auditoría
      await logCustomerAudit(
        manager,
        savedCustomer.id,
        AuditActionType.CREATE,
        userId,
        undefined,
        customerData
      );

      return savedCustomer;
    });

    revalidatePath('/home/dispatch/customers');

    return {
      success: true,
      message: 'Cliente creado exitosamente',
      data: result ? serializeCustomer(result) : null,
    };
  } catch (error: any) {
    console.error('[createCustomer] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al crear el cliente',
    };
  }
}

/**
 * UPDATE - Actualizar un cliente existente
 */
export async function updateCustomer(data: UpdateCustomerInput, auditUserId?: string): Promise<CustomerResult> {
  try {
    if (!data.id || data.id.trim() === '') {
      return { success: false, error: 'ID inválido' };
    }

    const db = await getDb();

    // Obtener el cliente actual
    const existingCustomer = await db.getRepository(Customer).findOne({
      where: { id: data.id, deletedAt: IsNull() }
    });

    if (!existingCustomer) {
      return { success: false, error: 'Cliente no encontrado' };
    }

    // Validaciones
    const updates: Partial<Customer> = {};

    if (data.personId !== undefined) {
      if (!data.personId.trim()) {
        return { success: false, error: 'La persona es requerida' };
      }

      // Verificar que la persona existe
      const personExists = await db.getRepository('Person').findOne({
        where: { id: data.personId, deletedAt: IsNull() }
      });

      if (!personExists) {
        return { success: false, error: 'La persona especificada no existe' };
      }

      // Verificar que no exista ya un cliente con la misma persona (excluyendo el actual)
      const duplicateCustomer = await db.getRepository(Customer).findOne({
        where: {
          personId: data.personId,
          deletedAt: IsNull(),
          id: data.id // Excluir el registro actual
        }
      });

      if (duplicateCustomer) {
        return { success: false, error: 'Ya existe otro cliente con esta persona' };
      }

      updates.personId = data.personId.trim();
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
        console.warn('[updateCustomer] No se pudo obtener la sesión del usuario para auditoría');
      }
    }

    const oldValues = {
      personId: existingCustomer.personId,
    };

    const result = await db.transaction(async (manager) => {
      await manager.update(Customer, data.id, updates);

      const updatedCustomer = await manager.findOne(Customer, {
        where: { id: data.id },
        relations: ['person']
      });

      // Registrar auditoría
      await logCustomerAudit(
        manager,
        data.id,
        AuditActionType.UPDATE,
        userId,
        oldValues,
        updates
      );

      return updatedCustomer;
    });

    revalidatePath('/home/dispatch/customers');

    return {
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: result ? serializeCustomer(result) : null,
    };
  } catch (error: any) {
    console.error('[updateCustomer] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al actualizar el cliente',
    };
  }
}

/**
 * DELETE - Eliminar un cliente (soft delete)
 */
export async function deleteCustomer(id: string, auditUserId?: string): Promise<CustomerResult> {
  try {
    if (!id || id.trim() === '') {
      return { success: false, error: 'ID inválido' };
    }

    const db = await getDb();

    // Obtener el cliente actual
    const existingCustomer = await db.getRepository(Customer).findOne({
      where: { id, deletedAt: IsNull() }
    });

    if (!existingCustomer) {
      return { success: false, error: 'Cliente no encontrado' };
    }

    // Obtener userId para auditoría si no se proporcionó
    let userId = auditUserId;
    if (!userId) {
      try {
        const { userId: sessionUserId } = await getCurrentUserSession();
        userId = sessionUserId;
      } catch (error) {
        console.warn('[deleteCustomer] No se pudo obtener la sesión del usuario para auditoría');
      }
    }

    const oldValues = {
      personId: existingCustomer.personId,
    };

    const result = await db.transaction(async (manager) => {
      // Soft delete
      await manager.update(Customer, id, {
        deletedAt: new Date(),
      });

      // Registrar auditoría
      await logCustomerAudit(
        manager,
        id,
        AuditActionType.DELETE,
        userId,
        oldValues,
        undefined
      );

      return existingCustomer;
    });

    revalidatePath('/home/dispatch/customers');

    return {
      success: true,
      message: 'Cliente eliminado exitosamente',
      data: result ? serializeCustomer(result) : null,
    };
  } catch (error: any) {
    console.error('[deleteCustomer] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al eliminar el cliente',
    };
  }
}