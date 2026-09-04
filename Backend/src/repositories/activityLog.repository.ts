import { RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import logger from '../config/logger';

// ── Types ────────────────────────────────────────────────────────────────

export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface InsertActivityInput {
  tableName: string;
  recordId: number;
  action: ActivityAction;
  userId: number;
  summary?: string | null;
  details?: Record<string, unknown> | null;
}

export interface ActivityLogRow extends RowDataPacket {
  activity_id: number;
  table_name: string;
  record_id: number;
  action: ActivityAction;
  user_id: number;
  summary: string | null;
  details: string | null;
  created_at: Date;
  // JOINs opcionais
  user_name?: string;
  user_email?: string;
}

export interface ActivityLogFilters {
  limit?: number;
  offset?: number;
  tableName?: string;
  recordId?: number;
  userId?: number;
  action?: ActivityAction;
  startDate?: string;
  endDate?: string;
}

// ── Repository ───────────────────────────────────────────────────────────

const activityLogRepository = {
  /**
   * Registrar atividade de forma silenciosa — nunca interrompe a operação principal
   * Padrão Kaizen/Quoti
   */
  async insert(input: InsertActivityInput): Promise<void> {
    try {
      const pool = getPool();
      const summary = input.summary ?? null;
      const details = input.details
        ? JSON.stringify({ ...input.details, summary: summary ?? undefined })
        : summary
          ? JSON.stringify({ summary })
          : null;

      await pool.query(
        `INSERT INTO tb_activity_logs
          (table_name, record_id, action, user_id, summary, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [input.tableName, input.recordId, input.action, input.userId, summary, details]
      );
    } catch (error) {
      // Nunca propagar — audit log não pode quebrar a operação principal
      logger.error('Erro ao registrar activity log', {
        error: (error as Error).message,
        tableName: input.tableName,
        recordId: input.recordId,
        action: input.action,
      });
    }
  },

  /**
   * Listar logs com filtros opcionais — paginado, com total e nome do usuário
   */
  async list(params: ActivityLogFilters): Promise<{ rows: ActivityLogRow[]; total: number }> {
    const pool = getPool();
    const limit = Math.min(200, Math.max(1, params.limit ?? 50));
    const offset = Math.max(0, params.offset ?? 0);
    const conds: string[] = [];
    const vals: unknown[] = [];

    if (params.tableName) {
      conds.push('a.table_name = ?');
      vals.push(params.tableName);
    }
    if (typeof params.recordId === 'number') {
      conds.push('a.record_id = ?');
      vals.push(params.recordId);
    }
    if (typeof params.userId === 'number') {
      conds.push('a.user_id = ?');
      vals.push(params.userId);
    }
    if (params.action) {
      conds.push('a.action = ?');
      vals.push(params.action);
    }
    if (params.startDate) {
      conds.push('a.created_at >= ?');
      vals.push(params.startDate);
    }
    if (params.endDate) {
      conds.push('a.created_at <= ?');
      vals.push(params.endDate);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) as total FROM tb_activity_logs a ${where}`,
      vals
    );

    const [rows] = await pool.query<ActivityLogRow[]>(
      `SELECT a.activity_id, a.table_name, a.record_id, a.action, a.user_id,
              a.summary, a.details, a.created_at,
              u.name AS user_name, u.email AS user_email
         FROM tb_activity_logs a
         LEFT JOIN tb_users u ON u.id = a.user_id
         ${where}
        ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );

    return { rows, total: countRows[0]?.total || 0 };
  },
};

export default activityLogRepository;
