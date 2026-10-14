import type { DataSource } from 'typeorm';

/**
 * Removes ProductiveUnit from existing DBs:
 * drop producers.productiveUnitId (+ FK/index) and drop productive_units table.
 * Idempotent for fresh schemas that already omit units.
 */
export async function ensureProducersWithoutUnits(ds: DataSource): Promise<void> {
  const producersRows: Array<{ TABLE_NAME: string }> = await ds.query(
    `
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'producers'
    LIMIT 1
  `,
  );

  if (producersRows.length > 0) {
    const columnRows: Array<{ COLUMN_NAME: string }> = await ds.query(
      `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'producers'
        AND COLUMN_NAME = 'productiveUnitId'
      LIMIT 1
    `,
    );

    if (columnRows.length > 0) {
      const fkRows: Array<{ CONSTRAINT_NAME: string }> = await ds.query(
        `
        SELECT CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'producers'
          AND COLUMN_NAME = 'productiveUnitId'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `,
      );

      for (const row of fkRows) {
        const name = String(row.CONSTRAINT_NAME || '').trim();
        if (!name) continue;
        await ds.query(`ALTER TABLE \`producers\` DROP FOREIGN KEY \`${name}\``);
      }

      const indexRows: Array<{ INDEX_NAME: string }> = await ds.query(
        `
        SELECT DISTINCT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'producers'
          AND COLUMN_NAME = 'productiveUnitId'
          AND INDEX_NAME <> 'PRIMARY'
      `,
      );

      for (const row of indexRows) {
        const name = String(row.INDEX_NAME || '').trim();
        if (!name) continue;
        try {
          await ds.query(`ALTER TABLE \`producers\` DROP INDEX \`${name}\``);
        } catch {
          // Index may already be gone with the FK drop.
        }
      }

      await ds.query(`ALTER TABLE \`producers\` DROP COLUMN \`productiveUnitId\``);
      console.log('[DB] producers.productiveUnitId eliminado');
    }
  }

  await ds.query(`DROP TABLE IF EXISTS \`productive_units\``);
}
