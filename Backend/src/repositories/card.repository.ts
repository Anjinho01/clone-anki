import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import { CardRow } from '../models/card.model';

function toCount(value: unknown): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

// ─── SELECT combinado: progresso FSRS + associação deck-card + conteúdo ─────
const CARD_SELECT = `
  deck_card.id    AS id,
  progress.id     AS progress_id,
  deck_card.deck_id,
  deck_card.card_id AS card_id,
  deck_card.card_id AS flashcard_id,
  progress.user_id,
  deck_card.id    AS deck_card_id,
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
  COALESCE(progress.is_deleted, FALSE) AS is_deleted,
  COALESCE(progress.created_at, deck_card.created_at) AS created_at,
  COALESCE(progress.updated_at, deck_card.updated_at) AS updated_at,
  card.front        AS f_front,
  card.back         AS f_back,
  card.card_type    AS f_card_type,
  card.mcq_options  AS f_mcq_options,
  card.mcq_correct  AS f_mcq_correct
`;

const cardRepository = {
  // ─── Leitura ───────────────────────────────────────────────────────────────

  async findById(cardId: number, userId: number): Promise<CardRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<CardRow[]>(
      `SELECT ${CARD_SELECT}
       FROM tb_card_progress progress
       JOIN tb_deck_cards deck_card ON deck_card.id = progress.deck_card_id AND deck_card.is_deleted = FALSE
       JOIN tb_cards card ON card.id = deck_card.card_id AND card.is_deleted = FALSE
       WHERE progress.id = ? AND progress.user_id = ? AND progress.is_deleted = FALSE
       LIMIT 1`,
      [cardId, userId]
    );
    return rows[0] || null;
  },

  async findByDeck(deckId: number, userId: number): Promise<CardRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<CardRow[]>(
      `SELECT ${CARD_SELECT}
       FROM tb_deck_cards deck_card
       LEFT JOIN tb_card_progress progress
         ON progress.deck_card_id = deck_card.id
        AND progress.user_id = ?
        AND progress.is_deleted = FALSE
       JOIN tb_cards card ON card.id = deck_card.card_id AND card.is_deleted = FALSE
       WHERE deck_card.deck_id = ? AND deck_card.is_deleted = FALSE
       ORDER BY deck_card.position ASC, deck_card.created_at ASC, deck_card.id ASC`,
      [userId, deckId]
    );
    return rows;
  },

  async findByDeckCardId(deckCardId: number, userId: number): Promise<CardRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<CardRow[]>(
      `SELECT ${CARD_SELECT}
       FROM tb_deck_cards deck_card
       JOIN tb_decks deck ON deck.id = deck_card.deck_id AND deck.is_deleted = FALSE
       LEFT JOIN tb_card_progress progress
         ON progress.deck_card_id = deck_card.id
        AND progress.user_id = ?
        AND progress.is_deleted = FALSE
       JOIN tb_cards card ON card.id = deck_card.card_id AND card.is_deleted = FALSE
       WHERE deck_card.id = ?
         AND deck_card.is_deleted = FALSE
         AND (deck.type = 'general' OR deck.owner_user_id = ?)
       LIMIT 1`,
      [userId, deckCardId, userId]
    );
    return rows[0] || null;
  },

  async ensureProgressForDeckCardId(deckCardId: number, userId: number): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT IGNORE INTO tb_card_progress (deck_card_id, user_id)
       SELECT deck_card.id, ?
       FROM tb_deck_cards deck_card
       JOIN tb_decks deck ON deck.id = deck_card.deck_id AND deck.is_deleted = FALSE
       JOIN tb_cards card ON card.id = deck_card.card_id AND card.is_deleted = FALSE
       WHERE deck_card.id = ?
         AND deck_card.is_deleted = FALSE
         AND (deck.type = 'general' OR deck.owner_user_id = ?)`,
      [userId, deckCardId, userId]
    );

    return result.affectedRows > 0;
  },

  async findDueCards(
    deckId: number,
    userId: number,
    newLimit: number,
    reviewLimit: number
  ): Promise<CardRow[]> {
    const pool = getPool();

    const [countResult] = await pool.query<(RowDataPacket & { cnt: number })[]>(
      `SELECT COUNT(DISTINCT rl.card_progress_id) AS cnt
       FROM tb_review_logs rl
       WHERE rl.user_id = ?
         AND DATE(rl.reviewed_at) = CURDATE()
         AND rl.pre_state = 0
         AND rl.card_progress_id IN (
           SELECT progress.id
           FROM tb_card_progress progress
           INNER JOIN tb_deck_cards deck_card ON deck_card.id = progress.deck_card_id
           WHERE deck_card.deck_id = ? AND progress.user_id = ?
         )`,
      [userId, deckId, userId]
    );
    const reviewedNewToday = countResult[0]?.cnt ?? 0;
    const adjustedNewLimit = Math.max(0, newLimit - reviewedNewToday);

    const [existingNewCards] = await pool.query<CardRow[]>(
      `SELECT ${CARD_SELECT}
       FROM tb_card_progress progress
       JOIN tb_deck_cards deck_card ON deck_card.id = progress.deck_card_id AND deck_card.is_deleted = FALSE
       JOIN tb_cards card ON card.id = deck_card.card_id AND card.is_deleted = FALSE
       WHERE deck_card.deck_id = ? AND progress.user_id = ?
         AND progress.state = 0
         AND progress.is_suspended = FALSE AND progress.is_buried = FALSE AND progress.is_deleted = FALSE
       ORDER BY progress.created_at
       LIMIT ?`,
      [deckId, userId, adjustedNewLimit]
    );

    const remainingNewLimit = Math.max(0, adjustedNewLimit - existingNewCards.length);
    let lazyNewCards: CardRow[] = [];

    if (remainingNewLimit > 0) {
      const [untouchedDeckCards] = await pool.query<(RowDataPacket & { id: number })[]>(
        `SELECT deck_card.id
         FROM tb_deck_cards deck_card
         LEFT JOIN tb_card_progress progress
           ON progress.deck_card_id = deck_card.id
          AND progress.user_id = ?
          AND progress.is_deleted = FALSE
         WHERE deck_card.deck_id = ?
           AND deck_card.is_deleted = FALSE
           AND progress.id IS NULL
         ORDER BY deck_card.position ASC, deck_card.created_at ASC, deck_card.id ASC
         LIMIT ?`,
        [userId, deckId, remainingNewLimit]
      );

      const deckCardIds = untouchedDeckCards.map((row) => row.id).filter((value) => value > 0);

      if (deckCardIds.length > 0) {
        const placeholders = deckCardIds.map(() => '(?, ?)').join(', ');
        const insertValues = deckCardIds.flatMap((deckCardId) => [deckCardId, userId]);

        await pool.query<ResultSetHeader>(
          `INSERT IGNORE INTO tb_card_progress (deck_card_id, user_id)
           VALUES ${placeholders}`,
          insertValues
        );

        const rowPlaceholders = deckCardIds.map(() => '?').join(', ');
        const [insertedRows] = await pool.query<CardRow[]>(
          `SELECT ${CARD_SELECT}
           FROM tb_card_progress progress
           JOIN tb_deck_cards deck_card ON deck_card.id = progress.deck_card_id AND deck_card.is_deleted = FALSE
           JOIN tb_cards card ON card.id = deck_card.card_id AND card.is_deleted = FALSE
           WHERE progress.user_id = ?
             AND progress.is_deleted = FALSE
             AND deck_card.id IN (${rowPlaceholders})
           ORDER BY deck_card.position ASC, deck_card.created_at ASC, deck_card.id ASC`,
          [userId, ...deckCardIds]
        );

        lazyNewCards = insertedRows;
      }
    }

    const [dueCards] = await pool.query<CardRow[]>(
      `SELECT ${CARD_SELECT}
       FROM tb_card_progress progress
       JOIN tb_deck_cards deck_card ON deck_card.id = progress.deck_card_id AND deck_card.is_deleted = FALSE
       JOIN tb_cards card ON card.id = deck_card.card_id AND card.is_deleted = FALSE
       WHERE deck_card.deck_id = ? AND progress.user_id = ?
         AND progress.state > 0 AND progress.due <= NOW()
         AND progress.is_suspended = FALSE AND progress.is_buried = FALSE AND progress.is_deleted = FALSE
       ORDER BY progress.due ASC
       LIMIT ?`,
      [deckId, userId, reviewLimit]
    );

    return [...existingNewCards, ...lazyNewCards, ...dueCards];
  },

  // ─── Criação de instâncias ────────────────────────────────────────────────

  async createInstance(deckId: number, flashcardId: number, userId: number): Promise<number> {
    const pool = getPool();
    await pool.query<ResultSetHeader>(
      `INSERT IGNORE INTO tb_deck_cards (deck_id, card_id, created_by)
       VALUES (?, ?, ?)`,
      [deckId, flashcardId, userId]
    );

    await pool.query<ResultSetHeader>(
      `INSERT IGNORE INTO tb_card_progress (deck_card_id, user_id)
       SELECT id, ? FROM tb_deck_cards WHERE deck_id = ? AND card_id = ?`,
      [userId, deckId, flashcardId]
    );

    const [rows] = await pool.query<(RowDataPacket & { id: number })[]>(
      `SELECT progress.id
       FROM tb_card_progress progress
       INNER JOIN tb_deck_cards deck_card ON deck_card.id = progress.deck_card_id
       WHERE deck_card.deck_id = ? AND deck_card.card_id = ? AND progress.user_id = ?
       LIMIT 1`,
      [deckId, flashcardId, userId]
    );

    return rows[0]?.id ?? 0;
  },

  /** Garante a associação deck/card sem materializar progresso para todos os usuários. */
  async createInstancesForAllUsers(deckId: number, flashcardId: number): Promise<number> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT IGNORE INTO tb_deck_cards (deck_id, card_id)
       VALUES (?, ?)`,
      [deckId, flashcardId]
    );
    return result.affectedRows;
  },

  // ─── Atualização FSRS ──────────────────────────────────────────────────────

  async updateFSRSState(
    cardId: number,
    userId: number,
    state: number,
    difficulty: number,
    stability: number,
    retrievability: number,
    elapsedDays: number,
    scheduledDays: number,
    reps: number,
    lapses: number,
    due: Date,
    lastReview: Date | null
  ): Promise<void> {
    const pool = getPool();
    await pool.query(
      `UPDATE tb_card_progress
       SET state = ?, difficulty = ?, stability = ?, retrievability = ?,
           elapsed_days = ?, scheduled_days = ?, reps = ?, lapses = ?,
           due = ?, last_review = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [state, difficulty, stability, retrievability, elapsedDays, scheduledDays,
       reps, lapses, due, lastReview, cardId, userId]
    );
  },

  async update(cardId: number, userId: number, fields: Record<string, unknown>): Promise<boolean> {
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
    values.push(cardId, userId);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tb_card_progress SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  async softDelete(cardId: number, userId: number): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE tb_card_progress SET is_deleted = TRUE, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [cardId, userId]
    );
    return result.affectedRows > 0;
  },

  /** Remove todas as instâncias de um flashcard em um deck (admin remove flashcard do deck). */
  async deleteByDeckAndFlashcard(deckId: number, flashcardId: number): Promise<number> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM tb_deck_cards WHERE deck_id = ? AND card_id = ?',
      [deckId, flashcardId]
    );
    return result.affectedRows;
  },

  // ─── Suspend / Bury ────────────────────────────────────────────────────────

  async suspend(cardId: number, userId: number): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE tb_card_progress SET is_suspended = TRUE, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [cardId, userId]
    );
    return result.affectedRows > 0;
  },

  async unsuspend(cardId: number, userId: number): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE tb_card_progress SET is_suspended = FALSE, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [cardId, userId]
    );
    return result.affectedRows > 0;
  },

  async bury(cardId: number, userId: number): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE tb_card_progress SET is_buried = TRUE, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [cardId, userId]
    );
    return result.affectedRows > 0;
  },

  async unburyExpired(deckId: number, userId: number): Promise<number> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tb_card_progress progress
       INNER JOIN tb_deck_cards deck_card ON deck_card.id = progress.deck_card_id
       SET progress.is_buried = FALSE, progress.updated_at = NOW()
       WHERE deck_card.deck_id = ? AND progress.user_id = ?
         AND progress.is_buried = TRUE AND DATE(progress.updated_at) < CURDATE()`,
      [deckId, userId]
    );
    return result.affectedRows;
  },

  // ─── Contagem (batch, evita N+1) ────────────────────────────────────────────

  async countCardsForDecks(
    deckIds: number[],
    userId: number
  ): Promise<Map<number, { total: number; new: number; due: number }>> {
    if (deckIds.length === 0) return new Map();

    const pool = getPool();
    const placeholders = deckIds.map(() => '?').join(', ');

    const [rows] = await pool.query<
      (RowDataPacket & { deck_id: number; total: number; new_count: number; due_count: number })[]
    >(
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

    const map = new Map<number, { total: number; new: number; due: number }>();
    for (const row of rows) {
      map.set(toCount(row.deck_id), {
        total: toCount(row.total),
        new: toCount(row.new_count),
        due: toCount(row.due_count),
      });
    }
    return map;
  },
};

export default cardRepository;
