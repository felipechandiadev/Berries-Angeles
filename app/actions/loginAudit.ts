// Server Actions para auditoría de login
'use server'

import { Audit } from '../../data/entities/Audit';
import { AuditActionType } from '../../data/entities/audit.types';
import { getDb } from '../../data/db';

export enum LoginAuditAction {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
}

/**
 * Registra intento de login en la tabla de auditoría
 */
export async function logLoginAudit(
  userName: string,
  action: LoginAuditAction,
  details?: string
): Promise<void> {
  try {
    const db = await getDb();
    
    // Encontrar el usuario para obtener su ID (si existe)
    const userRepo = db.getRepository('User');
    let userId: string | undefined;
    
    try {
      const user = await userRepo.findOneBy({ userName });
      userId = user?.id;
    } catch (error) {
      // Si hay error buscando el usuario, continuar sin userId
      console.warn('[logLoginAudit] No se pudo encontrar usuario:', userName);
      userId = undefined;
    }

    const audit = new Audit();
    audit.entityName = 'Auth'; // Entidad especial para login
    audit.entityId = userName; // Usar userName como identificador
    audit.userId = userId; // ID del usuario logueado (si existe)
    audit.action = action as any; // Convertir enum a string
    audit.description = `${action} para usuario: ${userName}${details ? ` - ${details}` : ''}`;
    audit.oldValues = undefined;
    audit.newValues = {
      userName,
      action,
      timestamp: new Date().toISOString(),
    };
    audit.changes = {
      fields: {},
      summary: `${action}`,
      changeCount: 0,
    };

    await db.getRepository(Audit).save(audit);
    console.log('[logLoginAudit] Auditoría registrada:', action, 'para usuario:', userName);
  } catch (error) {
    console.error('[logLoginAudit] Error logging audit:', error);
    // No lanzar error para no interrumpir el proceso de login
  }
}
