// Server Actions para CRUD de la entidad Person
'use server';

import {
  Person,
  AccountTypeName,
  BankName,
  type PersonBankAccount,
} from '../../data/entities/Person';
import { getDb } from '../../data/db';
import { AuditActionType } from '../../data/entities/audit.types';
import { logPersonAudit } from './audit.persons';
import { getCurrentUserSession } from './auth.server';
import { revalidatePath } from 'next/cache';

const allowedAccountTypes = new Set<string>(Object.values(AccountTypeName));
const allowedBankNames = new Set<string>(Object.values(BankName));

function sanitizeBankAccounts(input?: PersonBankAccount[] | null): PersonBankAccount[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const sanitizedAccounts: PersonBankAccount[] = [];

  for (const rawAccount of input) {
    if (!rawAccount) continue;

    const accountTypeRaw =
      typeof rawAccount.accountType === 'string' ? rawAccount.accountType.trim() : '';
    const bankRaw = typeof rawAccount.bank === 'string' ? rawAccount.bank.trim() : '';
    const accountNumber =
      typeof rawAccount.accountNumber === 'string' ? rawAccount.accountNumber.trim() : '';

    if (!accountTypeRaw || !bankRaw || !accountNumber) continue;
    if (!allowedAccountTypes.has(accountTypeRaw) || !allowedBankNames.has(bankRaw)) continue;

    const sanitizedAccount: PersonBankAccount = {
      accountType: accountTypeRaw as AccountTypeName,
      bank: bankRaw as BankName,
      accountNumber,
    };

    if (typeof rawAccount.alias === 'string') {
      const alias = rawAccount.alias.trim();
      if (alias) sanitizedAccount.alias = alias;
    }

    if (rawAccount.isPrimary !== undefined) {
      sanitizedAccount.isPrimary = Boolean(rawAccount.isPrimary);
    }

    sanitizedAccounts.push(sanitizedAccount);
  }

  return sanitizedAccounts;
}

export interface PersonCreateInput {
  name: string;
  dni?: string;
}

export interface PersonUpdateInput {
  id: string;
  name?: string;
  dni?: string;
}

export interface PersonResult {
  success: boolean;
  message?: string;
  data?: Person | Person[] | null;
  error?: string;
}

/**
 * CREATE - Crear una nueva persona
 * @param data Datos parciales de Person (name, dni)
 * @returns Persona creada con ID
 */
export async function createPerson(data: PersonCreateInput): Promise<PersonResult> {
  try {
    // Validaciones
    if (!data.name?.trim()) {
      return { success: false, error: 'El nombre es requerido' };
    }

    const db = await getDb();
    const repo = db.getRepository(Person);

    const person = repo.create({
      name: data.name.trim(),
      dni: data.dni?.trim() || undefined,
    });

    const saved = await repo.save(person);

    return {
      success: true,
      message: 'Persona creada exitosamente',
      data: saved,
    };
  } catch (error: any) {
    console.error('[createPerson] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al crear la persona',
    };
  }
}

/**
 * READ - Obtener todas las personas
 * @returns Array de personas
 */
export async function getPersons(): Promise<PersonResult> {
  try {
    const db = await getDb();
    const persons = await db.getRepository(Person).find();

    return {
      success: true,
      data: persons,
    };
  } catch (error: any) {
    console.error('[getPersons] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al obtener personas',
      data: [],
    };
  }
}

/**
 * READ - Obtener una persona por ID
 * @param id ID de la persona (UUID)
 * @returns Persona encontrada o null
 */
export async function getPersonById(id: string): Promise<PersonResult> {
  try {
    if (!id?.trim()) {
      return { success: false, error: 'ID inválido', data: null };
    }

    const db = await getDb();
    const person = await db.getRepository(Person).findOne({ where: { id } });

    if (!person) {
      return { success: false, error: 'Persona no encontrada', data: null };
    }

    return {
      success: true,
      data: person,
    };
  } catch (error: any) {
    console.error('[getPersonById] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al obtener la persona',
      data: null,
    };
  }
}

/**
 * UPDATE - Actualizar una persona
 * @param id ID de la persona (UUID)
 * @param data Datos a actualizar
 * @returns Persona actualizada
 */
export async function updatePerson(id: string, data: PersonUpdateInput, auditUserId?: string): Promise<PersonResult> {
  try {
    // Validaciones
    if (!id?.trim()) {
      return { success: false, error: 'ID inválido' };
    }

    if (!data.name?.trim() && !data.dni?.trim()) {
      return { success: false, error: 'Debe proporcionar al menos un campo para actualizar' };
    }

    const db = await getDb();
    const repo = db.getRepository(Person);

    // Verificar que la persona existe
    const existingPerson = await repo.findOne({ where: { id } });
    if (!existingPerson) {
      return { success: false, error: 'Persona no encontrada' };
    }

    // Preparar datos a actualizar (sin campos vacíos)
    const updateData: Partial<Person> = {};
    if (data.name?.trim()) {
      updateData.name = data.name.trim();
    }
    if (data.dni?.trim()) {
      updateData.dni = data.dni.trim();
    }

    // Guardar valores antiguos para auditoría
    const oldValues = {
      name: existingPerson.name,
      dni: existingPerson.dni,
    };

    // Actualizar y auditar en transacción
    let userId = auditUserId;
    if (!userId) {
      try {
        const { userId: sessionUserId } = await getCurrentUserSession();
        userId = sessionUserId;
      } catch (error) {
        userId = undefined;
      }
    }

    let updated: Person | null = null;
    await db.transaction(async (manager) => {
      await manager.update(Person, id, updateData);
      updated = await manager.findOne(Person, { where: { id } });
      await logPersonAudit(
        manager,
        id,
        AuditActionType.UPDATE,
        userId,
        oldValues,
        updateData
      );
    });

    return {
      success: true,
      message: 'Persona actualizada exitosamente',
      data: updated,
    };
  } catch (error: any) {
    console.error('[updatePerson] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al actualizar la persona',
    };
  }
}

/**
 * DELETE - Eliminar una persona
 * Nota: Si la persona tiene soft delete enabled, se marcará como eliminada
 * @param id ID de la persona (UUID)
 * @returns Persona eliminada
 */
export async function deletePerson(id: string): Promise<PersonResult> {
  try {
    // Validaciones
    if (!id?.trim()) {
      return { success: false, error: 'ID inválido' };
    }

    const db = await getDb();
    const repo = db.getRepository(Person);

    // Obtener la persona antes de eliminarla (para retornarla)
    const person = await repo.findOne({ where: { id } });
    if (!person) {
      return { success: false, error: 'Persona no encontrada' };
    }

    // Usar softRemove si está disponible, de lo contrario delete
    if (repo.softRemove) {
      await repo.softRemove(person);
    } else {
      await repo.delete(id);
    }

    return {
      success: true,
      message: 'Persona eliminada exitosamente',
      data: person,
    };
  } catch (error: any) {
    console.error('[deletePerson] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al eliminar la persona',
    };
  }
}

/**
 * UPDATE - Actualizar cuentas bancarias de una persona
 */
export async function updatePersonBankAccounts(
  personId: string,
  bankAccounts: PersonBankAccount[],
): Promise<PersonResult> {
  try {
    if (!personId?.trim()) {
      return { success: false, error: 'ID de persona inválido' };
    }

    const db = await getDb();
    const repo = db.getRepository(Person);

    const person = await repo.findOne({ where: { id: personId } });
    if (!person) {
      return { success: false, error: 'Persona no encontrada' };
    }

    const sanitized = sanitizeBankAccounts(bankAccounts);
    const oldValues = { bankAccounts: person.bankAccounts };

    let userId: string | undefined;
    try {
      const session = await getCurrentUserSession();
      userId = session.userId;
    } catch {
      /* optional session */
    }

    await db.transaction(async (manager) => {
      await manager.update(Person, personId, {
        bankAccounts: sanitized.length > 0 ? sanitized : null,
      });
      await logPersonAudit(
        manager,
        personId,
        AuditActionType.UPDATE,
        userId,
        oldValues,
        { bankAccounts: sanitized },
      );
    });

    revalidatePath('/home/productiveManagement/producers', 'layout');

    return {
      success: true,
      message: 'Cuentas bancarias actualizadas exitosamente',
    };
  } catch (error: any) {
    console.error('[updatePersonBankAccounts] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al actualizar cuentas bancarias',
    };
  }
}
