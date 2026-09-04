import { getPool } from '../config/database';
import logger from '../config/logger';

export async function runSyncMigration(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tb_sync_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      synced_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES tb_users(id) ON DELETE CASCADE,
      INDEX idx_sync_user (user_id),
      INDEX idx_sync_date (synced_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  logger.info('Migration: tb_sync_log ✓');
}
