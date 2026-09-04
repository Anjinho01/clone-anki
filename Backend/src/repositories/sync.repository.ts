import { RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import { DeckRow } from '../models/deck.model';
import { CardRow } from '../models/card.model';
import { ReviewLogRow } from '../models/reviewLog.model';

const SYNC_CARD_SELECT = `
  deck_card.id AS id,
  progress.id AS progress_id,
  deck_card.deck_id,
  deck_card.card_id AS card_id,
  deck_card.card_id AS flashcard_id,
  progress.user_id,
  deck_card.id AS deck_card_id,
  COALESCE(progress.state, 0) AS state,
  COALESCE(progress.difficulty, 0) AS difficulty,
  COALESCE(progress.stability, 0) AS stability,
  COALESCE(progress.retrievability, 0) AS retrievability,
  COALESCE(progress.elapsed_days, 0) AS elapsed_days,
  COALESCE(progress.scheduled_days, 0) AS scheduled_days,
  COALESCE(progress.reps, 0) AS reps,
  COALESCE(progress.lapses, 0) AS lapses,
  progress.due,
  progress.last_review,
  COALESCE(progress.is_suspended, FALSE) AS is_suspended,
  COALESCE(progress.is_buried, FALSE) AS is_buried,
  CASE
    WHEN deck_card.is_deleted = TRUE OR card.is_deleted = TRUE THEN TRUE
    ELSE COALESCE(progress.is_deleted, FALSE)
  END AS is_deleted,
  COALESCE(progress.created_at, deck_card.created_at) AS created_at,
  GREATEST(
    deck_card.updated_at,
    COALESCE(progress.updated_at, deck_card.updated_at),
    COALESCE(card.updated_at, deck_card.updated_at)
  ) AS updated_at,
  card.front AS f_front,
  card.back AS f_back,
  card.card_type AS f_card_type,
  card.mcq_options AS f_mcq_options,
  card.mcq_correct AS f_mcq_correct
`;

/**
 * Repository de sync — busca mudanças por timestamp
 */
const syncRepository = {
  // -- Buscar mudanças do servidor desde lastSyncAt ---

  async getDecksChangedSince(userId: number, since: Date): Promise<DeckRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<DeckRow[]>(
      `SELECT *
       FROM tb_decks
       WHERE (type = 'general' OR owner_user_id = ?)
         AND updated_at > ?`,
      [userId, since]
    );
    return rows;
  },

  async getCardsChangedSince(userId: number, since: Date): Promise<CardRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<CardRow[]>(
      `SELECT ${SYNC_CARD_SELECT}
       FROM tb_deck_cards deck_card
       INNER JOIN tb_decks deck ON deck.id = deck_card.deck_id
       INNER JOIN tb_cards card ON card.id = deck_card.card_id
       LEFT JOIN tb_card_progress progress
         ON progress.deck_card_id = deck_card.id
        AND progress.user_id = ?
       WHERE (deck.type = 'general' OR deck.owner_user_id = ?)
         AND (
           deck_card.updated_at > ?
           OR card.updated_at > ?
           OR (progress.id IS NOT NULL AND progress.updated_at > ?)
         )`,
      [userId, userId, since, since, since]
    );
    return rows;
  },

  async getReviewLogsCreatedSince(userId: number, since: Date): Promise<ReviewLogRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<ReviewLogRow[]>(
      'SELECT * FROM tb_review_logs WHERE user_id = ? AND created_at > ?',
      [userId, since]
    );
    return rows;
  },

  // -- Buscar tudo (primeiro sync) ---

  async getAllDecks(userId: number): Promise<DeckRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<DeckRow[]>(
      `SELECT *
       FROM tb_decks
       WHERE type = 'general' OR owner_user_id = ?`,
      [userId]
    );
    return rows;
  },

  async getAllCards(userId: number): Promise<CardRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<CardRow[]>(
      `SELECT ${SYNC_CARD_SELECT}
       FROM tb_deck_cards deck_card
       INNER JOIN tb_decks deck ON deck.id = deck_card.deck_id
       INNER JOIN tb_cards card ON card.id = deck_card.card_id
       LEFT JOIN tb_card_progress progress
         ON progress.deck_card_id = deck_card.id
        AND progress.user_id = ?
        AND progress.is_deleted = FALSE
       WHERE (deck.type = 'general' OR deck.owner_user_id = ?)
         AND deck_card.is_deleted = FALSE
         AND card.is_deleted = FALSE`,
      [userId, userId]
    );
    return rows;
  },

  async getAllReviewLogs(userId: number): Promise<ReviewLogRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<ReviewLogRow[]>(
      'SELECT * FROM tb_review_logs WHERE user_id = ?',
      [userId]
    );
    return rows;
  },

  // -- Salvar timestamp de sync ---

  async saveSyncTimestamp(userId: number, syncAt: Date): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO tb_sync_log (user_id, synced_at) VALUES (?, ?)`,
      [userId, syncAt]
    );
  },

  async getLastSync(userId: number): Promise<Date | null> {
    const pool = getPool();
    const [rows] = await pool.query<(RowDataPacket & { synced_at: Date })[]>(
      'SELECT synced_at FROM tb_sync_log WHERE user_id = ? ORDER BY synced_at DESC LIMIT 1',
      [userId]
    );
    return rows[0]?.synced_at || null;
  },
};

export default syncRepository;
