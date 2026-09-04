import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import { DeckRow } from '../models/deck.model';

function toCount(value: unknown): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

type CountRow = RowDataPacket & { total: number | string };

const deckRepository = {
  async findAll(): Promise<DeckRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<DeckRow[]>(
      "SELECT * FROM tb_decks WHERE is_deleted = FALSE ORDER BY position, name"
    );
    return rows;
  },

  async findGeneralDecks(): Promise<DeckRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<DeckRow[]>(
      "SELECT * FROM tb_decks WHERE type = 'general' AND is_deleted = FALSE ORDER BY position, name"
    );
    return rows;
  },

  async findPrivateDecksForUser(userId: number): Promise<DeckRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<DeckRow[]>(
      "SELECT * FROM tb_decks WHERE type = 'private' AND owner_user_id = ? AND is_deleted = FALSE ORDER BY position, name",
      [userId]
    );
    return rows;
  },

  async countPrivateDecksForUser(userId: number): Promise<number> {
    const pool = getPool();
    const [rows] = await pool.query<CountRow[]>(
      "SELECT COUNT(*) AS total FROM tb_decks WHERE type = 'private' AND owner_user_id = ? AND is_deleted = FALSE",
      [userId]
    );
    return toCount(rows[0]?.total);
  },

  async countGeneralDecks(): Promise<number> {
    const pool = getPool();
    const [rows] = await pool.query<CountRow[]>(
      "SELECT COUNT(*) AS total FROM tb_decks WHERE type = 'general' AND is_deleted = FALSE"
    );
    return toCount(rows[0]?.total);
  },

  async findById(id: number): Promise<DeckRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<DeckRow[]>(
      'SELECT * FROM tb_decks WHERE id = ? AND is_deleted = FALSE LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async findByUuid(uuid: string): Promise<DeckRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<DeckRow[]>(
      'SELECT * FROM tb_decks WHERE uuid = ? AND is_deleted = FALSE LIMIT 1',
      [uuid]
    );
    return rows[0] || null;
  },

  async create(
    packageId: number | null,
    name: string,
    description: string | null,
    type: 'general' | 'private',
    ownerUserId: number | null,
    createdBy: number,
    newCardsPerDay: number,
    reviewCardsPerDay: number,
    desiredRetention: number,
    position: number
  ): Promise<number> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tb_decks
        (uuid, package_id, name, description, type, owner_user_id, created_by,
          new_cards_per_day, review_cards_per_day, desired_retention, position)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [packageId, name, description, type, ownerUserId, createdBy,
       newCardsPerDay, reviewCardsPerDay, desiredRetention, position]
    );
    return result.insertId;
  },

  async update(id: number, fields: Record<string, unknown>): Promise<boolean> {
    const pool = getPool();
    const setClauses: string[] = [];
    const values: unknown[] = [];
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        setClauses.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (setClauses.length === 0) return false;
    setClauses.push('updated_at = NOW()');
    values.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tb_decks SET ${setClauses.join(', ')} WHERE id = ? AND is_deleted = FALSE`,
      values
    );
    return result.affectedRows > 0;
  },

  async softDelete(id: number): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE tb_decks SET is_deleted = TRUE, updated_at = NOW() WHERE id = ? AND is_deleted = FALSE',
      [id]
    );
    return result.affectedRows > 0;
  },

  async countCards(deckId: number, userId: number): Promise<{ total: number; new: number; due: number }> {
    const pool = getPool();
    const [rows] = await pool.query<(RowDataPacket & { total: number; new_count: number; due_count: number })[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN progress.id IS NULL OR progress.state = 0 THEN 1 ELSE 0 END) AS new_count,
         SUM(CASE WHEN progress.state > 0 AND progress.due <= NOW() THEN 1 ELSE 0 END) AS due_count
       FROM tb_deck_cards deck_card
       LEFT JOIN tb_card_progress progress
         ON progress.deck_card_id = deck_card.id
        AND progress.user_id = ?
        AND progress.is_deleted = FALSE
       WHERE deck_card.deck_id = ?
         AND deck_card.is_deleted = FALSE`,
      [userId, deckId]
    );
    return {
      total: toCount(rows[0]?.total),
      new: toCount(rows[0]?.new_count),
      due: toCount(rows[0]?.due_count),
    };
  },

  async countCardsForDecks(
    deckIds: number[],
    userId: number
  ): Promise<Map<number, { total: number; new: number; due: number }>> {
    if (deckIds.length === 0) return new Map();
    const pool = getPool();
    const placeholders = deckIds.map(() => '?').join(', ');
    const [rows] = await pool.query<(RowDataPacket & {
      deck_id: number; total: number; new_count: number; due_count: number;
    })[]>(
      `SELECT
         deck_card.deck_id,
         COUNT(*) AS total,
         SUM(CASE WHEN progress.id IS NULL OR progress.state = 0 THEN 1 ELSE 0 END) AS new_count,
         SUM(CASE WHEN progress.state > 0 AND progress.due <= NOW() THEN 1 ELSE 0 END) AS due_count
       FROM tb_deck_cards deck_card
       LEFT JOIN tb_card_progress progress
         ON progress.deck_card_id = deck_card.id
        AND progress.user_id = ?
        AND progress.is_deleted = FALSE
       WHERE deck_card.deck_id IN (${placeholders})
         AND deck_card.is_deleted = FALSE
       GROUP BY deck_card.deck_id`,
      [userId, ...deckIds]
    );
    const result = new Map<number, { total: number; new: number; due: number }>();
    for (const row of rows) {
      result.set(toCount(row.deck_id), {
        total: toCount(row.total),
        new: toCount(row.new_count),
        due: toCount(row.due_count),
      });
    }
    return result;
  },
};

export default deckRepository;
