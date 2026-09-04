import { getPool } from '../config/database';
import logger from '../config/logger';

export async function runReviewLogsMigration(): Promise<void> {
  const pool = getPool();

  // card_progress_id referencia tb_card_progress.id.
  // O estado FSRS da revisão é snapshot do progresso no momento do review.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tb_review_logs (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      card_progress_id INT NOT NULL     COMMENT 'Referência ao tb_card_progress.id',
      user_id          INT NOT NULL,
      rating           TINYINT NOT NULL COMMENT '1=Again, 2=Hard, 3=Good, 4=Easy',
      state            TINYINT NOT NULL COMMENT '0=New, 1=Learning, 2=Review, 3=Relearning',

      -- Snapshot FSRS pós-review
      difficulty       DOUBLE NOT NULL DEFAULT 0,
      stability        DOUBLE NOT NULL DEFAULT 0,
      retrievability   DOUBLE NOT NULL DEFAULT 0,
      elapsed_days     INT    NOT NULL DEFAULT 0,
      scheduled_days   INT    NOT NULL DEFAULT 0,

      -- Snapshot FSRS pré-review (para undo)
      pre_state          TINYINT DEFAULT NULL,
      pre_difficulty     DOUBLE  DEFAULT NULL,
      pre_stability      DOUBLE  DEFAULT NULL,
      pre_retrievability DOUBLE  DEFAULT NULL,
      pre_elapsed_days   INT     DEFAULT NULL,
      pre_scheduled_days INT     DEFAULT NULL,
      pre_reps           INT     DEFAULT NULL,
      pre_lapses         INT     DEFAULT NULL,
      pre_due            TIMESTAMP NULL DEFAULT NULL,
      pre_last_review    TIMESTAMP NULL DEFAULT NULL,

      -- Timing
      duration_ms  INT       NOT NULL DEFAULT 0,
      reviewed_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (card_progress_id) REFERENCES tb_card_progress(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id)  REFERENCES tb_users(id)          ON DELETE CASCADE,
      INDEX idx_reviews_card_progress (card_progress_id),
      INDEX idx_reviews_user    (user_id),
      INDEX idx_reviews_date    (reviewed_at),
      INDEX idx_reviews_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  logger.info('Migration: tb_review_logs ✓');
}
