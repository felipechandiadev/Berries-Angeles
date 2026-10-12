import type { DataSource } from 'typeorm';

/**
 * Removes the Storage domain from existing DBs:
 * drop pallets.storageId (+ FK/index) and drop storages table.
 * Idempotent for fresh schemas that already omit Storage.
 */
export async function ensurePalletsWithoutStorage(ds: DataSource): Promise<void> {
  const palletsRows: Array<{ TABLE_NAME: string }> = await ds.query(
    `
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pallets'
    LIMIT 1
  `,
  );

  if (palletsRows.length > 0) {
    const columnRows: Array<{ COLUMN_NAME: string }> = await ds.query(
      `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'pallets'
        AND COLUMN_NAME = 'storageId'
      LIMIT 1
    `,
    );

    if (columnRows.length > 0) {
      const fkRows: Array<{ CONSTRAINT_NAME: string }> = await ds.query(
        `
        SELECT CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'pallets'
          AND COLUMN_NAME = 'storageId'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `,
      );

      for (const row of fkRows) {
        const name = String(row.CONSTRAINT_NAME || '').trim();
        if (!name) continue;
        await ds.query(`ALTER TABLE \`pallets\` DROP FOREIGN KEY \`${name}\``);
      }

      const indexRows: Array<{ INDEX_NAME: string }> = await ds.query(
        `
        SELECT DISTINCT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'pallets'
          AND COLUMN_NAME = 'storageId'
          AND INDEX_NAME <> 'PRIMARY'
      `,
      );

      for (const row of indexRows) {
        const name = String(row.INDEX_NAME || '').trim();
        if (!name) continue;
        try {
          await ds.query(`ALTER TABLE \`pallets\` DROP INDEX \`${name}\``);
        } catch {
          // Index may already be gone with the FK drop.
        }
      }

      await ds.query(`ALTER TABLE \`pallets\` DROP COLUMN \`storageId\``);
    }
  }

  await ds.query(`DROP TABLE IF EXISTS \`storages\``);
}
