import type { DataSource } from 'typeorm';
import { APP_CONFIG_SINGLETON_ID } from './entities/AppConfig';

/**
 * TypeORM synchronize may be off in this project.
 * Ensure `app_config` exists and has the singleton row.
 */
export async function ensureAppConfigTable(ds: DataSource): Promise<void> {
  await ds.query(`
    CREATE TABLE IF NOT EXISTS \`app_config\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`requireBankAccountsInPayments\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ds.query(
    `
    INSERT INTO \`app_config\` (\`id\`, \`requireBankAccountsInPayments\`)
    VALUES (?, TRUE)
    ON DUPLICATE KEY UPDATE \`id\` = \`id\`
  `,
    [APP_CONFIG_SINGLETON_ID],
  );
}
