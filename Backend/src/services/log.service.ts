import activityLogRepository, { ActivityLogFilters } from '../repositories/activityLog.repository';
import userRepository from '../repositories/user.repository';
import type { RoleName } from '../models/user.model';
import { ForbiddenError } from '../errors/httpError';

const logService = {
  /**
   * Listar activity logs (CREATE, UPDATE, DELETE)
   *
   * - develop/admin: vê todos ou filtra por userId
   * - user: vê apenas os próprios logs
   */
  async listActivityLogs(
    requesterUserId: number,
    requesterRole: RoleName,
    filters: ActivityLogFilters
  ) {
    // user só pode ver seus próprios logs
    if (requesterRole === 'user') {
      if (filters.userId && filters.userId !== requesterUserId) {
        throw new ForbiddenError('Você só pode visualizar seus próprios logs');
      }
      filters.userId = requesterUserId;
    }

    const { rows, total } = await activityLogRepository.list(filters);

    return {
      logs: rows.map((r) => ({
        id: r.activity_id,
        tableName: r.table_name,
        recordId: r.record_id,
        action: r.action,
        userId: r.user_id,
        userName: r.user_name || null,
        userEmail: r.user_email || null,
        summary: r.summary,
        details: r.details ? safeJsonParse(r.details) : null,
        createdAt: r.created_at,
      })),
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  },

  /**
   * Listar access logs (login/tentativas)
   *
   * - develop/admin: vê todos ou filtra
   * - user: vê apenas seus próprios acessos
   */
  async listAccessLogs(
    requesterUserId: number,
    requesterRole: RoleName,
    filters: {
      limit?: number;
      offset?: number;
      userId?: number;
      email?: string;
      success?: boolean;
      startDate?: string;
      endDate?: string;
    }
  ) {
    // user só pode ver seus próprios logs
    if (requesterRole === 'user') {
      if (filters.userId && filters.userId !== requesterUserId) {
        throw new ForbiddenError('Você só pode visualizar seus próprios logs');
      }
      filters.userId = requesterUserId;
    }

    const { rows, total } = await userRepository.listAccessLogs(filters);

    return {
      logs: rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        userName: r.user_name || null,
        email: r.email,
        success: !!r.success,
        ipAddress: r.ip_address,
        userAgent: r.user_agent,
        createdAt: r.created_at,
      })),
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  },
};

/**
 * Parse seguro de JSON (details pode ser string ou já objeto)
 */
function safeJsonParse(value: unknown): unknown {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

export default logService;
