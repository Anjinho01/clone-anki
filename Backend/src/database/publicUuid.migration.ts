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

async function anyIndexExists(tableName: string, indexNames: string[]): Promise<boolean> {
  for (const indexName of indexNames) {
    if (await indexExists(tableName, indexName)) {
      return true;
    }
  }

  return false;
}

async function ensurePublicUuid(
  tableName: string,
  indexName: string,
  legacyIndexNames: string[] = []
): Promise<void> {
  const pool = getPool();

  if (!(await columnExists(tableName, 'uuid'))) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN uuid CHAR(36) DEFAULT NULL AFTER id`);
  }

  await pool.query(`UPDATE ${tableName} SET uuid = UUID() WHERE uuid IS NULL OR uuid = ''`);
  await pool.query(`ALTER TABLE ${tableName} MODIFY COLUMN uuid CHAR(36) NOT NULL`);

  if (!(await anyIndexExists(tableName, [indexName, ...legacyIndexNames]))) {
    await pool.query(`ALTER TABLE ${tableName} ADD UNIQUE INDEX ${indexName} (uuid)`);
  }
}

export async function runPublicUuidMigration(): Promise<void> {
  await ensurePublicUuid('tb_decks', 'uk_decks_uuid');
  await ensurePublicUuid('tb_packages', 'uk_packages_uuid', ['uk_flashcards_uuid']);
  await ensurePublicUuid('tb_cards', 'uk_cards_uuid');

  logger.info('Migration: public UUIDs ✓');
}