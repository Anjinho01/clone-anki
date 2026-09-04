import { RowDataPacket } from 'mysql2';

export interface ReviewLogRow extends RowDataPacket {
  id: number;
  card_progress_id: number;
  user_id: number;
  rating: number;
  state: number;
  // Snapshot pós-review (FSRS)
  difficulty: number;
  stability: number;
  retrievability: number;
  elapsed_days: number;
  scheduled_days: number;
  // Snapshot pré-review (para undo)
  pre_state: number | null;
  pre_difficulty: number | null;
  pre_stability: number | null;
  pre_retrievability: number | null;
  pre_elapsed_days: number | null;
  pre_scheduled_days: number | null;
  pre_reps: number | null;
  pre_lapses: number | null;
  pre_due: Date | null;
  pre_last_review: Date | null;
  // Duração da resposta
  duration_ms: number;
  reviewed_at: Date;
  created_at: Date;
}

export interface ReviewLog {
  id: number;
  cardId: number;
  userId: number;
  rating: number;
  state: number;
  difficulty: number;
  stability: number;
  retrievability: number;
  elapsedDays: number;
  scheduledDays: number;
  durationMs: number;
  reviewedAt: Date;
  createdAt: Date;
}

export function toReviewLog(row: ReviewLogRow): ReviewLog {
  return {
    id: row.id,
    cardId: row.card_progress_id,
    userId: row.user_id,
    rating: row.rating,
    state: row.state,
    difficulty: row.difficulty,
    stability: row.stability,
    retrievability: row.retrievability,
    elapsedDays: row.elapsed_days,
    scheduledDays: row.scheduled_days,
    durationMs: row.duration_ms,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}
