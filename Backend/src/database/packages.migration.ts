import { RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import logger from '../config/logger';

async function tableExists(tableName: string): Promise<boolean> {
  const pool = getPool();
  const [rows] = await pool.query<(RowDataPacket & { table_name: string })[]>(
    `SELECT TABLE_NAME AS table_name
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return rows.length > 0;
}

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

export async function runPackagesMigration(): Promise<void> {
  const pool = getPool();

  if (
    (await tableExists('tb_flashcards')) &&
    !(await tableExists('tb_packages'))
  ) {
    await pool.query('RENAME TABLE tb_flashcards TO tb_packages');
  }

  // ─── tb_packages ──────────────────────────────────────────────────────────
  // Entidade raiz do domínio: package lógico que reúne N decks.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tb_packages (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      name         VARCHAR(200) NOT NULL,
      description  TEXT DEFAULT NULL,
      type         ENUM('general','private') NOT NULL DEFAULT 'general',
      owner_user_id INT DEFAULT NULL,
      created_by   INT DEFAULT NULL,
      position     INT NOT NULL DEFAULT 0,
      is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
      created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_user_id) REFERENCES tb_users(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES tb_users(id) ON DELETE SET NULL,
      INDEX idx_packages_type (type),
      INDEX idx_packages_owner (owner_user_id),
      INDEX idx_packages_creator (created_by),
      INDEX idx_packages_updated (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (!(await columnExists('tb_packages', 'description'))) {
    await pool.query(
      `ALTER TABLE tb_packages
       ADD COLUMN description TEXT DEFAULT NULL AFTER name`
    );
  }

  if (!(await columnExists('tb_packages', 'type'))) {
    await pool.query(
      `ALTER TABLE tb_packages
       ADD COLUMN type ENUM('general','private') NOT NULL DEFAULT 'general' AFTER description`
    );
  }

  if (!(await columnExists('tb_packages', 'owner_user_id'))) {
    await pool.query(
      `ALTER TABLE tb_packages
       ADD COLUMN owner_user_id INT DEFAULT NULL AFTER type`
    );
  }

  if (!(await columnExists('tb_packages', 'created_by'))) {
    await pool.query(
      `ALTER TABLE tb_packages
       ADD COLUMN created_by INT DEFAULT NULL AFTER owner_user_id`
    );
  }

  if (!(await columnExists('tb_packages', 'position'))) {
    await pool.query(
      `ALTER TABLE tb_packages
       ADD COLUMN position INT NOT NULL DEFAULT 0 AFTER created_by`
    );
  }

  if (!(await columnExists('tb_packages', 'is_deleted'))) {
    await pool.query(
      `ALTER TABLE tb_packages
       ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER position`
    );
  }

  if (!(await columnExists('tb_packages', 'created_at'))) {
    await pool.query(
      `ALTER TABLE tb_packages
       ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER is_deleted`
    );
  }

  if (!(await columnExists('tb_packages', 'updated_at'))) {
    await pool.query(
      `ALTER TABLE tb_packages
       ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at`
    );
  }

  await pool.query(
    `UPDATE tb_packages
     SET type = CASE
         WHEN type IS NULL OR type NOT IN ('general', 'private') THEN 'general'
         ELSE type
       END,
       position = COALESCE(position, 0),
       is_deleted = COALESCE(is_deleted, FALSE),
       updated_at = NOW()`
  );

  if (!(await indexExists('tb_packages', 'idx_packages_type'))) {
    await pool.query('ALTER TABLE tb_packages ADD INDEX idx_packages_type (type)');
  }

  if (!(await indexExists('tb_packages', 'idx_packages_owner'))) {
    await pool.query('ALTER TABLE tb_packages ADD INDEX idx_packages_owner (owner_user_id)');
  }

  if (!(await indexExists('tb_packages', 'idx_packages_creator'))) {
    await pool.query('ALTER TABLE tb_packages ADD INDEX idx_packages_creator (created_by)');
  }

  if (!(await indexExists('tb_packages', 'idx_packages_updated'))) {
    await pool.query('ALTER TABLE tb_packages ADD INDEX idx_packages_updated (updated_at)');
  }

  if (!(await columnExists('tb_decks', 'package_id'))) {
    await pool.query(
      'ALTER TABLE tb_decks ADD COLUMN package_id INT DEFAULT NULL AFTER id'
    );
    await pool.query('ALTER TABLE tb_decks ADD INDEX idx_decks_package (package_id)');
  }

  const [generalDeckRows] = await pool.query<(RowDataPacket & { has_general: number })[]>(
    `SELECT COUNT(*) AS has_general
     FROM tb_decks
     WHERE type = 'general' AND is_deleted = FALSE AND package_id IS NULL`
  );

  if ((generalDeckRows[0]?.has_general ?? 0) > 0) {
    const [existingGeneral] = await pool.query<(RowDataPacket & { id: number })[]>(
      `SELECT id
       FROM tb_packages
       WHERE type = 'general' AND owner_user_id IS NULL AND is_deleted = FALSE
       ORDER BY id ASC
       LIMIT 1`
    );

    const generalPackageId = existingGeneral[0]?.id;

    if (generalPackageId) {
      await pool.query(
        `UPDATE tb_decks
         SET package_id = ?
         WHERE type = 'general' AND is_deleted = FALSE AND package_id IS NULL`,
        [generalPackageId]
      );
    } else {
      const [sampleGeneralDeck] = await pool.query<
        (RowDataPacket & { created_by: number | null })[]
      >(
        `SELECT created_by
         FROM tb_decks
         WHERE type = 'general' AND is_deleted = FALSE
         ORDER BY id ASC
         LIMIT 1`
      );

      await pool.query(
        `INSERT INTO tb_packages
         (name, description, type, owner_user_id, created_by, position)
         VALUES (?, ?, 'general', NULL, ?, 0)`,
        ['Colecao Geral', 'Grupo gerado automaticamente durante a refatoracao.', sampleGeneralDeck[0]?.created_by ?? null]
      );

      const [createdGeneral] = await pool.query<(RowDataPacket & { id: number })[]>(
        `SELECT id
         FROM tb_packages
         WHERE type = 'general' AND owner_user_id IS NULL AND is_deleted = FALSE
         ORDER BY id DESC
         LIMIT 1`
      );

      if (createdGeneral[0]?.id) {
        await pool.query(
          `UPDATE tb_decks
           SET package_id = ?
           WHERE type = 'general' AND is_deleted = FALSE AND package_id IS NULL`,
          [createdGeneral[0].id]
        );
      }
    }
  }

  if (!(await columnExists('tb_decks', 'package_id'))) {
    throw new Error('Falha ao preparar tb_decks.package_id');
  }

  const [fkRows] = await pool.query<(RowDataPacket & { constraint_name: string })[]>(
    `SELECT CONSTRAINT_NAME AS constraint_name
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'tb_decks'
       AND COLUMN_NAME IN ('flashcard_id', 'package_id')
       AND REFERENCED_TABLE_NAME IN ('tb_flashcards', 'tb_packages')`
  );

  if (fkRows.length === 0) {
    await pool.query(
      `ALTER TABLE tb_decks
       ADD CONSTRAINT fk_decks_packages
       FOREIGN KEY (package_id) REFERENCES tb_packages(id) ON DELETE SET NULL`
    );
  }

  logger.info('Migration: tb_packages ✓');
}
