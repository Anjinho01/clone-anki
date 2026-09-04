import { getPool } from '../config/database';
import logger from '../config/logger';

export async function runNotificationsMigration(): Promise<void> {
  const pool = getPool();

  // ─── Tabela principal de notificações ──────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tb_notifications (
      notification_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id          INT NULL COMMENT 'Destinatário específico (unicast)',
      audience_role    ENUM('develop','admin','monitor','user') NULL COMMENT 'Broadcast por role',
      title            VARCHAR(140) NOT NULL,
      message          VARCHAR(500) NULL,
      link_url         VARCHAR(300) NULL,
      link_label       VARCHAR(120) NULL,
      link_params      LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
      is_read          TINYINT(1) NOT NULL DEFAULT 0,
      read_at          DATETIME NULL,
      created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at       DATETIME NULL,
      actor_user_id    INT NULL COMMENT 'Quem gerou a notificação',

      INDEX idx_notif_user (user_id, is_read, created_at),
      INDEX idx_notif_role (audience_role, is_read, created_at),
      INDEX idx_notif_exp  (expires_at),

      CONSTRAINT fk_notif_user  FOREIGN KEY (user_id)       REFERENCES tb_users(id) ON DELETE CASCADE,
      CONSTRAINT fk_notif_actor FOREIGN KEY (actor_user_id) REFERENCES tb_users(id) ON DELETE SET NULL,
      CONSTRAINT chk_link_params_json CHECK (link_params IS NULL OR JSON_VALID(link_params))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    ALTER TABLE tb_notifications
    MODIFY COLUMN audience_role ENUM('develop','admin','monitor','user') NULL COMMENT 'Broadcast por role'
  `);

  // ─── Recibos de leitura para notificações broadcast ────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tb_notification_receipts (
      notification_id  BIGINT NOT NULL,
      user_id          INT NOT NULL,
      read_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (notification_id, user_id),
      CONSTRAINT fk_notirec_notif FOREIGN KEY (notification_id)
        REFERENCES tb_notifications(notification_id) ON DELETE CASCADE,
      CONSTRAINT fk_notirec_user FOREIGN KEY (user_id)
        REFERENCES tb_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  logger.info('Migration: tb_notifications + tb_notification_receipts ✓');
}
