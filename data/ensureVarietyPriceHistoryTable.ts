import type { DataSource } from 'typeorm';

export async function ensureVarietyPriceHistoryTable(ds: DataSource): Promise<void> {
  await ds.query(`
    CREATE TABLE IF NOT EXISTS \`variety_price_history\` (
      \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`varietyId\` INT NOT NULL,
      \`qualityId\` INT NOT NULL,
      \`qualityName\` VARCHAR(255) NOT NULL,
      \`priceCLP\` INT NOT NULL DEFAULT 0,
      \`priceUSD\` FLOAT NOT NULL DEFAULT 0,
      \`currency\` ENUM('CLP', 'USD') NOT NULL DEFAULT 'CLP',
      \`source\` ENUM('SINGLE', 'BULK', 'QUALITY_CREATED', 'VARIETY_CREATED') NOT NULL,
      \`changedByUserId\` VARCHAR(36) NULL,
      \`changedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      INDEX \`idx_vph_varietyId\` (\`varietyId\`),
      INDEX \`idx_vph_qualityId\` (\`qualityId\`),
      INDEX \`idx_vph_changedAt\` (\`changedAt\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
