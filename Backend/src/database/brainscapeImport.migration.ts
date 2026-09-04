import fs from 'fs/promises';
import { createHash } from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import env from '../config/env';
import logger from '../config/logger';

const ADMIN_EMAIL = 'admin@dombarreto.g12.br';

type BrainscapeCard = {
  index?: number;
  question?: string | null;
  answer?: string | null;
};

type BrainscapeDeck = {
  id?: string | null;
  name?: string | null;
  fileName?: string | null;
  source?: string | null;
  cards?: BrainscapeCard[] | null;
};

type BrainscapePack = {
  id?: string | null;
  name?: string | null;
  decks?: BrainscapeDeck[] | null;
};

function toDeterministicUuid(seed: string): string {
  const hex = createHash('sha1').update(seed).digest('hex').slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

function asText(value: string | null | undefined, fallback = ''): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function deriveDeckName(deck: BrainscapeDeck): string {
  const explicitName = asText(deck.name);
  if (explicitName) {
    return explicitName;
  }

  const fileName = asText(deck.fileName);
  if (fileName) {
    return fileName
      .replace(/\.deck-\d+\.csv$/i, '')
      .replace(/_/g, ' ')
      .trim();
  }

  return asText(deck.id, 'Deck importado do Brainscape');
}

function buildPackDescription(pack: BrainscapePack, deckCount: number, cardCount: number): string {
  return [
    'Importado automaticamente do Brainscape.',
    `Pack original: ${asText(pack.id, 'sem-id')}.`,
    `Decks: ${deckCount}.`,
    `Cards: ${cardCount}.`,
    `Marcador: ${env.BRAINSCAPE_IMPORT_TAG}.`,
  ].join(' ');
}

function buildDeckDescription(pack: BrainscapePack, deck: BrainscapeDeck, cardCount: number): string {
  return [
    'Deck importado automaticamente do Brainscape.',
    `Pack original: ${asText(pack.id, 'sem-id')}.`,
    `Deck original: ${asText(deck.id, 'sem-id')}.`,
    deck.fileName ? `Arquivo: ${deck.fileName}.` : null,
    deck.source ? `Origem: ${deck.source}.` : null,
    `Cards: ${cardCount}.`,
    `Marcador: ${env.BRAINSCAPE_IMPORT_TAG}.`,
  ]
    .filter(Boolean)
    .join(' ');
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findUserIdByEmail(email: string): Promise<number | null> {
  const pool = getPool();
  const [rows] = await pool.query<(RowDataPacket & { id: number })[]>(
    'SELECT id FROM tb_users WHERE email = ? LIMIT 1',
    [email]
  );

  return rows[0]?.id ?? null;
}

async function resolveImportActorId(): Promise<number> {
  const adminUserId = await findUserIdByEmail(ADMIN_EMAIL);
  if (adminUserId) {
    return adminUserId;
  }

  throw new Error(`Usuario admin nao encontrado para importacao Brainscape: ${ADMIN_EMAIL}`);
}

async function resolveBrainscapeExportPath(): Promise<string> {
  if (await fileExists(env.BRAINSCAPE_EXPORT_PATH)) {
    return env.BRAINSCAPE_EXPORT_PATH;
  }

  throw new Error(
    `Arquivo de exportacao Brainscape nao encontrado: ${env.BRAINSCAPE_EXPORT_PATH}`
  );
}

async function readBrainscapeExport(): Promise<BrainscapePack[]> {
  const exportPath = await resolveBrainscapeExportPath();
  const raw = await fs.readFile(exportPath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error('Exportacao Brainscape invalida: raiz precisa ser um array de packs');
  }

  return parsed as BrainscapePack[];
}

async function ensurePackageColumns(): Promise<void> {
  const pool = getPool();

  const [columns] = await pool.query<(RowDataPacket & { column_name: string })[]>(
    `SELECT COLUMN_NAME AS column_name
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_packages'`
  );

  const columnNames = new Set(columns.map((column) => column.column_name));

  if (!columnNames.has('type')) {
    await pool.query(
      `ALTER TABLE tb_packages
       ADD COLUMN type ENUM('general','private') NOT NULL DEFAULT 'general' AFTER description`
    );
  }

  if (!columnNames.has('owner_user_id')) {
    await pool.query(
      `ALTER TABLE tb_packages
       ADD COLUMN owner_user_id INT DEFAULT NULL AFTER type`
    );
  }

  if (!columnNames.has('created_by')) {
    await pool.query(
      `ALTER TABLE tb_packages
       ADD COLUMN created_by INT DEFAULT NULL AFTER owner_user_id`
    );
  }

  if (!columnNames.has('position')) {
    await pool.query(
      `ALTER TABLE tb_packages
       ADD COLUMN position INT NOT NULL DEFAULT 0 AFTER created_by`
    );
  }

  if (!columnNames.has('is_deleted')) {
    await pool.query(
      `ALTER TABLE tb_packages
       ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER position`
    );
  }

  if (!columnNames.has('created_at')) {
    await pool.query(
      `ALTER TABLE tb_packages
       ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER is_deleted`
    );
  }

  if (!columnNames.has('updated_at')) {
    await pool.query(
      `ALTER TABLE tb_packages
       ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at`
    );
  }

  await pool.query(
    `UPDATE tb_packages
     SET type = COALESCE(type, 'general'),
         owner_user_id = owner_user_id,
         position = COALESCE(position, 0),
         is_deleted = COALESCE(is_deleted, FALSE)`
  );
}

async function ensurePackage(params: {
  uuid: string;
  name: string;
  description: string;
  actorId: number;
}): Promise<number> {
  const pool = getPool();

  await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO tb_packages
      (uuid, name, description, type, owner_user_id, created_by, position)
     VALUES (?, ?, ?, 'general', NULL, ?, 0)`,
    [params.uuid, params.name, params.description, params.actorId]
  );

  const [rows] = await pool.query<(RowDataPacket & { id: number })[]>(
    'SELECT id FROM tb_packages WHERE uuid = ? LIMIT 1',
    [params.uuid]
  );

  if (!rows[0]?.id) {
    throw new Error(`Falha ao garantir grupo importado: ${params.name}`);
  }

  return rows[0].id;
}

async function ensureDeck(params: {
  uuid: string;
  packageId: number;
  name: string;
  description: string;
  actorId: number;
}): Promise<number> {
  const pool = getPool();

  await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO tb_decks
      (
        uuid,
        package_id,
        name,
        description,
        type,
        owner_user_id,
        created_by,
        new_cards_per_day,
        review_cards_per_day,
        desired_retention,
        position
      )
     VALUES (?, ?, ?, ?, 'general', NULL, ?, 20, 100, 0.90, 0)`,
    [params.uuid, params.packageId, params.name, params.description, params.actorId]
  );

  const [rows] = await pool.query<(RowDataPacket & { id: number; package_id: number | null })[]>(
    'SELECT id, package_id FROM tb_decks WHERE uuid = ? LIMIT 1',
    [params.uuid]
  );

  const deckId = rows[0]?.id;
  if (!deckId) {
    throw new Error(`Falha ao garantir deck importado: ${params.name}`);
  }

  if (rows[0].package_id == null) {
    await pool.query('UPDATE tb_decks SET package_id = ? WHERE id = ?', [params.packageId, deckId]);
  }

  return deckId;
}

async function ensureLibraryCard(params: {
  uuid: string;
  front: string;
  back: string;
  actorId: number;
}): Promise<number> {
  const pool = getPool();

  await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO tb_cards
      (uuid, type, owner_user_id, created_by, front, back, card_type, mcq_options, mcq_correct)
     VALUES (?, 'general', NULL, ?, ?, ?, 'basic', NULL, NULL)`,
    [params.uuid, params.actorId, params.front, params.back]
  );

  const [rows] = await pool.query<(RowDataPacket & { id: number })[]>(
    'SELECT id FROM tb_cards WHERE uuid = ? LIMIT 1',
    [params.uuid]
  );

  if (!rows[0]?.id) {
    throw new Error('Falha ao garantir card importado do Brainscape');
  }

  return rows[0].id;
}

async function ensureDeckCard(deckId: number, cardId: number, actorId: number): Promise<number> {
  const pool = getPool();

  await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO tb_deck_cards (deck_id, card_id, created_by, position)
     VALUES (?, ?, ?, 0)`,
    [deckId, cardId, actorId]
  );

  const [rows] = await pool.query<(RowDataPacket & { id: number })[]>(
    'SELECT id FROM tb_deck_cards WHERE deck_id = ? AND card_id = ? LIMIT 1',
    [deckId, cardId]
  );

  if (!rows[0]?.id) {
    throw new Error(`Falha ao garantir associacao deck/card (${deckId}/${cardId})`);
  }

  return rows[0].id;
}

export async function runBrainscapeImportMigration(): Promise<void> {
  await ensurePackageColumns();
  const actorId = await resolveImportActorId();

  const packs = await readBrainscapeExport();

  let importedGroups = 0;
  let importedDecks = 0;
  let importedCards = 0;
  let importedLinks = 0;

  for (const pack of packs) {
    const packId = asText(pack.id, 'pack-sem-id');
    const packName = asText(pack.name, packId);
    const decks = Array.isArray(pack.decks) ? pack.decks : [];
    const packCardCount = decks.reduce((total, deck) => {
      return total + (Array.isArray(deck.cards) ? deck.cards.length : 0);
    }, 0);

    const packageId = await ensurePackage({
      uuid: toDeterministicUuid(`${env.BRAINSCAPE_IMPORT_TAG}:group:${packId}`),
      name: packName,
      description: buildPackDescription(pack, decks.length, packCardCount),
      actorId,
    });
    importedGroups += 1;

    for (const deck of decks) {
      const deckIdSource = asText(deck.id, `deck-sem-id-${importedDecks + 1}`);
      const deckCards = Array.isArray(deck.cards) ? deck.cards : [];
      const deckId = await ensureDeck({
        uuid: toDeterministicUuid(`${env.BRAINSCAPE_IMPORT_TAG}:deck:${packId}:${deckIdSource}`),
        packageId,
        name: deriveDeckName(deck),
        description: buildDeckDescription(pack, deck, deckCards.length),
        actorId,
      });
      importedDecks += 1;

      for (const card of deckCards) {
        const index = Number(card.index ?? 0) || deckCards.indexOf(card) + 1;
        const cardId = await ensureLibraryCard({
          uuid: toDeterministicUuid(
            `${env.BRAINSCAPE_IMPORT_TAG}:card:${packId}:${deckIdSource}:${index}`
          ),
          front: typeof card.question === 'string' ? card.question : '',
          back: typeof card.answer === 'string' ? card.answer : '',
          actorId,
        });
        importedCards += 1;

        await ensureDeckCard(deckId, cardId, actorId);
        importedLinks += 1;
      }
    }
  }

  logger.info(
    `Migration: importacao Brainscape ✓ packs=${importedGroups} decks=${importedDecks} cards=${importedCards} vinculos=${importedLinks}`
  );
}