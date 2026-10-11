import type { DataSource } from 'typeorm';
import { TransactionType } from './entities/Transaction';

/**
 * TypeORM `synchronize` often fails to append MySQL ENUM values.
 * Ensure every TransactionType (incl. SETTLEMENT) exists on transactions.type.
 */
export async function ensureTransactionTypeEnum(ds: DataSource): Promise<void> {
  const rows = await ds.query(
    `SELECT COLUMN_TYPE AS columnType
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'transactions'
       AND COLUMN_NAME = 'type'
     LIMIT 1`,
  );

  const columnType = String(rows?.[0]?.columnType ?? rows?.[0]?.COLUMN_TYPE ?? '');
  if (!columnType.toLowerCase().startsWith('enum(')) {
    return;
  }

  const required = Object.values(TransactionType);
  const missing = required.filter((value) => !columnType.includes(`'${value}'`));
  if (missing.length === 0) {
    return;
  }

  const enumList = required.map((value) => `'${value}'`).join(',');
  await ds.query(
    `ALTER TABLE \`transactions\` MODIFY COLUMN \`type\` ENUM(${enumList}) NOT NULL`,
  );
  console.log(
    `[DB] transactions.type ENUM actualizado (+${missing.join(', ')})`,
  );
}
