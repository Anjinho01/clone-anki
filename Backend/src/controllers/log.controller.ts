import { Request, Response, NextFunction } from 'express';
import logService from '../services/log.service';
import type { RoleName } from '../models/user.model';
import type { ActivityAction } from '../repositories/activityLog.repository';

const logController = {
  /**
   * GET /logs/activity — Listar logs de atividade (CRUD)
   *
   * Query params: tableName, recordId, userId, action, startDate, endDate, limit, offset
   */
  async listActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tableName, recordId, userId, action, startDate, endDate, limit, offset } = req.query;

      const result = await logService.listActivityLogs(
        req.user!.userId,
        req.user!.role as RoleName,
        {
          tableName: tableName as string | undefined,
          recordId: recordId ? parseInt(recordId as string, 10) : undefined,
          userId: userId ? parseInt(userId as string, 10) : undefined,
          action: action as ActivityAction | undefined,
          startDate: startDate as string | undefined,
          endDate: endDate as string | undefined,
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined,
        }
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /logs/access — Listar logs de acesso (login/tentativas)
   *
   * Query params: userId, email, success, startDate, endDate, limit, offset
   */
  async listAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, email, success, startDate, endDate, limit, offset } = req.query;

      const result = await logService.listAccessLogs(
        req.user!.userId,
        req.user!.role as RoleName,
        {
          userId: userId ? parseInt(userId as string, 10) : undefined,
          email: email as string | undefined,
          success: success !== undefined ? success === 'true' : undefined,
          startDate: startDate as string | undefined,
          endDate: endDate as string | undefined,
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined,
        }
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};

export default logController;
