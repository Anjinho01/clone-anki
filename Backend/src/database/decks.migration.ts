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

export async function runDecksMigration(): Promise<void> {
  const pool = getPool();

  // ─── tb_decks ────────────────────────────────────────────────
  //
  // Deck agora pertence a um package lógico (package_id).
  // Mantemos type/owner_user_id por compatibilidade com a camada atual de
  // autorização enquanto a refatoração do restante da aplicação avança.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tb_decks (
      id                   INT AUTO_INCREMENT PRIMARY KEY,
      package_id           INT DEFAULT NULL COMMENT 'Package ao qual o deck pertence',
      name                 VARCHAR(200) NOT NULL,
      description          TEXT DEFAULT NULL,
      type                 ENUM('general','private') NOT NULL DEFAULT 'general'
                             COMMENT 'general = admin/todos; private = criado pelo aluno',
      owner_user_id        INT DEFAULT NULL
                             COMMENT 'NULL = deck geral (admin); NOT NULL = deck privado do aluno',
      new_cards_per_day    INT NOT NULL DEFAULT 20,
      review_cards_per_day INT NOT NULL DEFAULT 100,
      desired_retention    DECIMAL(3,2) NOT NULL DEFAULT 0.90,
      position             INT NOT NULL DEFAULT 0
                             COMMENT 'Ordem de exibição na sidebar',
      created_by           INT DEFAULT NULL
                             COMMENT 'Usuário que criou (admin ou aluno)',
      is_deleted           BOOLEAN NOT NULL DEFAULT FALSE,
      created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_user_id) REFERENCES tb_users(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by)    REFERENCES tb_users(id) ON DELETE SET NULL,
      INDEX idx_decks_type        (type),
      INDEX idx_decks_package     (package_id),
      INDEX idx_decks_owner       (owner_user_id),
      INDEX idx_decks_creator     (created_by),
      INDEX idx_decks_updated     (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (
    (await columnExists('tb_decks', 'flashcard_id')) &&
    !(await columnExists('tb_decks', 'package_id'))
  ) {
    await pool.query(
      `ALTER TABLE tb_decks
       CHANGE COLUMN flashcard_id package_id INT DEFAULT NULL COMMENT 'Package ao qual o deck pertence'`
    );
  }

  if (!(await columnExists('tb_decks', 'package_id'))) {
    await pool.query(
      `ALTER TABLE tb_decks
       ADD COLUMN package_id INT DEFAULT NULL COMMENT 'Package ao qual o deck pertence' AFTER id`
    );
  }

  if (!(await indexExists('tb_decks', 'idx_decks_package'))) {
    await pool.query('ALTER TABLE tb_decks ADD INDEX idx_decks_package (package_id)');
  }

  logger.info('Migration: tb_decks ✓');
}

