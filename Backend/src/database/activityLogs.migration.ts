import { getPool } from '../config/database';
import logger from '../config/logger';

/**
 * Migration: tb_activity_logs
 * Padrão Kaizen/Quoti — registro de atividades CRUD
 */
export async function runActivityLogsMigration(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tb_activity_logs (
      activity_id   INT AUTO_INCREMENT PRIMARY KEY,
      table_name    VARCHAR(100)                          NOT NULL,
      record_id     INT                                   NOT NULL,
      action        ENUM('CREATE','UPDATE','DELETE')       NOT NULL,
      user_id       INT                                   NOT NULL,
      summary       VARCHAR(255)                          NULL,

      details       LONGTEXT
                    CHARACTER SET utf8mb4
                    COLLATE utf8mb4_bin
                    NULL,

      created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_activity_when    (created_at),
      INDEX idx_activity_target  (table_name, record_id),
      INDEX idx_activity_user    (user_id),

      CONSTRAINT fk_activity_user
        FOREIGN KEY (user_id) REFERENCES tb_users(id) ON DELETE CASCADE,

      CONSTRAINT chk_activity_details_json
        CHECK (details IS NULL OR JSON_VALID(details))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  logger.info('Migration tb_activity_logs executada ✓');
}
