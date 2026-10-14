import type { DataSource } from 'typeorm';
import { AuditActionType } from './entities/audit.types';

/**
 * El ENUM viejo de audits.action solo tenía LOGIN/LOGOUT y truncaba
 * LOGIN_SUCCESS / LOGIN_FAILED / UPDATE_PASSWORD. Pasamos a VARCHAR.
 */
export async function ensureAuditActionColumn(ds: DataSource): Promise<void> {
  const rows = await ds.query(
    `SELECT COLUMN_TYPE AS columnType, DATA_TYPE AS dataType
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'audits'
       AND COLUMN_NAME = 'action'
     LIMIT 1`,
  );

  if (!rows?.length) return;

  const dataType = String(rows[0]?.dataType ?? rows[0]?.DATA_TYPE ?? '').toLowerCase();
  const columnType = String(rows[0]?.columnType ?? rows[0]?.COLUMN_TYPE ?? '');

  if (dataType === 'varchar') {
    return;
  }

  // Si sigue siendo ENUM incompleto (o cualquier ENUM), migrar a VARCHAR.
  if (dataType === 'enum' || columnType.toLowerCase().startsWith('enum(')) {
    const sample = Object.values(AuditActionType).join(', ');
    await ds.query(
      `ALTER TABLE \`audits\` MODIFY COLUMN \`action\` VARCHAR(32) NOT NULL`,
    );
    console.log(
      `[DB] audits.action migrado de ENUM a VARCHAR(32) (soporta: ${sample})`,
    );
  }
}
