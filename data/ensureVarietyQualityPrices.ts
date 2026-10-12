import type { DataSource } from 'typeorm';

type ColumnRow = { COLUMN_NAME: string };

/**
 * Migrates varieties to qualityPrices JSON and drops flat price columns.
 * Idempotent for fresh schemas that already use qualityPrices only.
 */
export async function ensureVarietyQualityPrices(ds: DataSource): Promise<void> {
  const tableRows: Array<{ TABLE_NAME: string }> = await ds.query(
    `
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'varieties'
    LIMIT 1
  `,
  );
  if (tableRows.length === 0) return;

  const columns: ColumnRow[] = await ds.query(
    `
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'varieties'
  `,
  );
  const colSet = new Set(columns.map((c) => c.COLUMN_NAME));

  if (!colSet.has('qualityPrices')) {
    await ds.query(
      `ALTER TABLE \`varieties\` ADD COLUMN \`qualityPrices\` JSON NULL`,
    );
  }

  const hasFlatPrice = colSet.has('priceCLP') || colSet.has('priceUSD') || colSet.has('currency');

  if (hasFlatPrice) {
    const formats: Array<{ id: number; name: string; active: number | boolean }> = await ds.query(
      `SELECT id, name, active FROM \`formats\` WHERE deletedAt IS NULL ORDER BY id ASC`,
    );

    const varieties: Array<{
      id: number;
      priceCLP?: number;
      priceUSD?: number;
      currency?: string;
      qualityPrices?: unknown;
    }> = await ds.query(
      `SELECT id, priceCLP, priceUSD, currency, qualityPrices FROM \`varieties\``,
    );

    for (const variety of varieties) {
      let existing: unknown = variety.qualityPrices;
      if (typeof existing === 'string') {
        try {
          existing = JSON.parse(existing);
        } catch {
          existing = null;
        }
      }

      if (Array.isArray(existing) && existing.length > 0) {
        continue;
      }

      const priceCLP = Number(variety.priceCLP ?? 0) || 0;
      const priceUSD = Number(variety.priceUSD ?? 0) || 0;
      const currency = variety.currency === 'USD' ? 'USD' : 'CLP';

      const qualityPrices = formats.map((f) => ({
        qualityId: Number(f.id),
        qualityName: String(f.name),
        priceCLP,
        priceUSD,
        currency,
        active: f.active === undefined ? true : Boolean(f.active),
      }));

      await ds.query(`UPDATE \`varieties\` SET \`qualityPrices\` = ? WHERE \`id\` = ?`, [
        JSON.stringify(qualityPrices),
        variety.id,
      ]);
    }

    // Ensure non-null for rows that still have null
    await ds.query(
      `UPDATE \`varieties\` SET \`qualityPrices\` = JSON_ARRAY() WHERE \`qualityPrices\` IS NULL`,
    );

    const refreshed: ColumnRow[] = await ds.query(
      `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'varieties'
    `,
    );
    const refreshedSet = new Set(refreshed.map((c) => c.COLUMN_NAME));

    for (const col of ['priceCLP', 'priceUSD', 'currency'] as const) {
      if (refreshedSet.has(col)) {
        await ds.query(`ALTER TABLE \`varieties\` DROP COLUMN \`${col}\``);
      }
    }
  } else {
    await ds.query(
      `UPDATE \`varieties\` SET \`qualityPrices\` = JSON_ARRAY() WHERE \`qualityPrices\` IS NULL`,
    );
  }

  // Backfill `active` on qualityPrices entries from formats.active
  await backfillQualityPricesActive(ds);

  // Prefer NOT NULL when possible
  try {
    await ds.query(
      `ALTER TABLE \`varieties\` MODIFY COLUMN \`qualityPrices\` JSON NOT NULL`,
    );
  } catch {
    // Some MySQL versions / empty states may reject; leave nullable.
  }
}

async function backfillQualityPricesActive(ds: DataSource): Promise<void> {
  const formats: Array<{ id: number; active: number | boolean }> = await ds.query(
    `SELECT id, active FROM \`formats\` WHERE deletedAt IS NULL`,
  );
  if (formats.length === 0) return;

  const activeById = new Map(
    formats.map((f) => [Number(f.id), f.active === undefined ? true : Boolean(f.active)]),
  );

  const varieties: Array<{ id: number; qualityPrices: unknown }> = await ds.query(
    `SELECT id, qualityPrices FROM \`varieties\``,
  );

  for (const variety of varieties) {
    let raw: unknown = variety.qualityPrices;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
        continue;
      }
    }
    if (!Array.isArray(raw) || raw.length === 0) continue;

    let changed = false;
    const next = raw.map((entry) => {
      if (!entry || typeof entry !== 'object') return entry;
      const qualityId = Number((entry as { qualityId?: unknown }).qualityId);
      const hasActive = Object.prototype.hasOwnProperty.call(entry, 'active');
      const catalogActive = activeById.get(qualityId);
      if (hasActive && catalogActive === undefined) return entry;
      if (hasActive && Boolean((entry as { active?: unknown }).active) === catalogActive) {
        return entry;
      }
      // Missing active, or out of sync with Format.active → mirror catalog
      if (!hasActive || catalogActive !== undefined) {
        changed = true;
        return {
          ...(entry as Record<string, unknown>),
          active: catalogActive !== undefined ? catalogActive : true,
        };
      }
      return entry;
    });

    if (!changed) continue;

    await ds.query(`UPDATE \`varieties\` SET \`qualityPrices\` = ? WHERE \`id\` = ?`, [
      JSON.stringify(next),
      variety.id,
    ]);
  }
}
