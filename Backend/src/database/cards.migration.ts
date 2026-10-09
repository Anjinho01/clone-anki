import { RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import logger from '../config/logger';

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const pool = getPool();
  const [rows] = await pool.query<(RowDataPacket & { column_name: string })[]>(
    `SELECT COLUMN_NAME AS column_name
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function indexExists(tableName: string, indexName: string): Promise<boolean> {
  const pool = getPool();
  const [rows] = await pool.query<(RowDataPacket & { index_name: string })[]>(
    `SELECT INDEX_NAME AS index_name
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName]
  );
  return rows.length > 0;
}

export async function runCardsMigration(): Promise<void> {
  const pool = getPool();

  // ─── tb_cards ─────────────────────────────────────────────────────────────
  // Conteúdo reutilizável (card) que pode ser associado a N decks.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tb_cards (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      type            ENUM('general','private') NOT NULL DEFAULT 'general',
      owner_user_id   INT DEFAULT NULL,
      created_by      INT NOT NULL,
      front           TEXT NOT NULL,
      back            TEXT NOT NULL,
      front_img_url   TEXT NOT NULL,
      back_img_url    TEXT NOT NULL,
      card_type       ENUM('basic','reverse','cloze','mcq') NOT NULL DEFAULT 'basic',
      mcq_options     JSON DEFAULT NULL,
      mcq_correct     INT DEFAULT NULL,
      is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
      created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_user_id) REFERENCES tb_users(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES tb_users(id) ON DELETE RESTRICT,
      FULLTEXT INDEX ft_cards_content (front(500), back(500)),
      INDEX idx_cards_type (type),
      INDEX idx_cards_owner (owner_user_id),
      INDEX idx_cards_creator (created_by),
      INDEX idx_cards_updated (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (!(await columnExists('tb_cards', 'owner_user_id'))) {
    await pool.query(
      `ALTER TABLE tb_cards
       ADD COLUMN owner_user_id INT DEFAULT NULL AFTER created_by`
    );
  }

  if (!(await columnExists('tb_cards', 'type'))) {
    await pool.query(
      `ALTER TABLE tb_cards
       ADD COLUMN type ENUM('general','private') NOT NULL DEFAULT 'general' AFTER id`
    );
  }

  if (!(await indexExists('tb_cards', 'idx_cards_type'))) {
    await pool.query('ALTER TABLE tb_cards ADD INDEX idx_cards_type (type)');
  }

  if (!(await indexExists('tb_cards', 'idx_cards_owner'))) {
    await pool.query('ALTER TABLE tb_cards ADD INDEX idx_cards_owner (owner_user_id)');
  }

  // ─── tb_deck_cards ────────────────────────────────────────────────────────
  // Associação M:N entre deck e card reutilizável.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tb_deck_cards (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      deck_id         INT NOT NULL,
      card_id         INT NOT NULL,
      position        INT NOT NULL DEFAULT 0,
      created_by      INT DEFAULT NULL,
      is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
      created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (deck_id) REFERENCES tb_decks(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES tb_cards(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES tb_users(id) ON DELETE SET NULL,
      UNIQUE KEY uk_deck_card (deck_id, card_id),
      INDEX idx_deck_cards_deck (deck_id),
      INDEX idx_deck_cards_card (card_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // ─── tb_card_progress ─────────────────────────────────────────────────────
  // Estado FSRS por usuário em um card dentro de um deck específico.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tb_card_progress (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      deck_card_id    INT NOT NULL,
      user_id         INT NOT NULL,
      state           TINYINT NOT NULL DEFAULT 0 COMMENT '0=New,1=Learning,2=Review,3=Relearning',
      difficulty      DOUBLE NOT NULL DEFAULT 0,
      stability       DOUBLE NOT NULL DEFAULT 0,
      retrievability  DOUBLE NOT NULL DEFAULT 0,
      elapsed_days    INT NOT NULL DEFAULT 0,
      scheduled_days  INT NOT NULL DEFAULT 0,
      reps            INT NOT NULL DEFAULT 0,
      lapses          INT NOT NULL DEFAULT 0,
      due             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_review     TIMESTAMP NULL DEFAULT NULL,
      is_suspended    BOOLEAN NOT NULL DEFAULT FALSE,
      is_buried       BOOLEAN NOT NULL DEFAULT FALSE,
      is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
      created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (deck_card_id) REFERENCES tb_deck_cards(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES tb_users(id) ON DELETE CASCADE,
      UNIQUE KEY uk_card_progress (deck_card_id, user_id),
      INDEX idx_card_progress_user (user_id),
      INDEX idx_card_progress_due (due),
      INDEX idx_card_progress_study (user_id, is_deleted, is_suspended, is_buried, state, due)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  logger.info('Migration: tb_cards ✓');
}
