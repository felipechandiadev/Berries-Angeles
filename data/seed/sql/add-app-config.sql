-- Bootstrap app_config for existing databases (synchronize=false).
CREATE TABLE IF NOT EXISTS `app_config` (
  `id` VARCHAR(36) PRIMARY KEY,
  `requireBankAccountsInPayments` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `app_config` (`id`, `requireBankAccountsInPayments`)
VALUES ('1', TRUE)
ON DUPLICATE KEY UPDATE `id` = `id`;
