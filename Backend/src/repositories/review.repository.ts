import { ResultSetHeader } from 'mysql2';
import { getPool } from '../config/database';
import { ReviewLogRow } from '../models/reviewLog.model';

const reviewRepository = {
  async create(
    cardId: number,
    userId: number,
    rating: number,
    state: number,
    difficulty: number,
    stability: number,
    retrievability: number,
    elapsedDays: number,
    scheduledDays: number,
    durationMs: number,
    reviewedAt: Date,
    preSnapshot?: {
      state: number;
      difficulty: number;
      stability: number;
      retrievability: number;
      elapsed_days: number;
      scheduled_days: number;
      reps: number;
      lapses: number;
      due: Date;
      last_review: Date | null;
    }
  ): Promise<number> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tb_review_logs
       (card_progress_id, user_id, rating, state, difficulty, stability, retrievability,
        elapsed_days, scheduled_days, duration_ms, reviewed_at,
        pre_state, pre_difficulty, pre_stability, pre_retrievability,
        pre_elapsed_days, pre_scheduled_days, pre_reps, pre_lapses,
        pre_due, pre_last_review)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cardId, userId, rating, state, difficulty, stability, retrievability,
       elapsedDays, scheduledDays, durationMs, reviewedAt,
       preSnapshot?.state ?? null, preSnapshot?.difficulty ?? null,
       preSnapshot?.stability ?? null, preSnapshot?.retrievability ?? null,
       preSnapshot?.elapsed_days ?? null, preSnapshot?.scheduled_days ?? null,
       preSnapshot?.reps ?? null, preSnapshot?.lapses ?? null,
       preSnapshot?.due ?? null, preSnapshot?.last_review ?? null]
    );
    return result.insertId;
  },

  async findLastByCard(cardId: number, userId: number): Promise<ReviewLogRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<ReviewLogRow[]>(
      `SELECT * FROM tb_review_logs
       WHERE card_progress_id = ? AND user_id = ?
       ORDER BY reviewed_at DESC
       LIMIT 1`,
      [cardId, userId]
    );
    return rows[0] || null;
  },

  async deleteById(id: number, userId: number): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM tb_review_logs WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  async findByCard(cardId: number, userId: number): Promise<ReviewLogRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<ReviewLogRow[]>(
      `SELECT * FROM tb_review_logs
       WHERE card_progress_id = ? AND user_id = ?
       ORDER BY reviewed_at DESC`,
      [cardId, userId]
    );
    return rows;
  },

  async findByUser(userId: number, limit: number, offset: number): Promise<ReviewLogRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<ReviewLogRow[]>(
      `SELECT * FROM tb_review_logs
       WHERE user_id = ?
       ORDER BY reviewed_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return rows;
  },

  async getStudyStats(userId: number, days: number): Promise<{
    totalReviews: number;
    averageDurationMs: number;
    retentionRate: number;
    reviewsByDay: { date: string; count: number }[];
  }> {
    const pool = getPool();

    const [summary] = await pool.query<(import('mysql2').RowDataPacket & {
      total: number;
      avg_duration: number;
      good_or_easy: number;
    })[]>(
      `SELECT
         COUNT(*) as total,
         AVG(duration_ms) as avg_duration,
         SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) as good_or_easy
       FROM tb_review_logs
       WHERE user_id = ? AND reviewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [userId, days]
    );

    const [byDay] = await pool.query<(import('mysql2').RowDataPacket & {
      review_date: string;
      count: number;
    })[]>(
      `SELECT
         DATE(reviewed_at) as review_date,
         COUNT(*) as count
       FROM tb_review_logs
       WHERE user_id = ? AND reviewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(reviewed_at)
       ORDER BY review_date`,
      [userId, days]
    );

    const total = summary[0]?.total || 0;

    return {
      totalReviews: total,
      averageDurationMs: Math.round(summary[0]?.avg_duration || 0),
      retentionRate: total > 0 ? (summary[0]?.good_or_easy || 0) / total : 0,
      reviewsByDay: byDay.map((r) => ({ date: r.review_date, count: r.count })),
    };
  },
};

export default reviewRepository;
