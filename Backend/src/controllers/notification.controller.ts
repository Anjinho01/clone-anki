import { Request, Response, NextFunction } from 'express';
import { notificationRepository } from '../repositories/notification.repository';
import type { AudienceRole } from '../models/notification.model';

export const notificationController = {
  async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, role } = req.user!;
      const { onlyUnread, limit, offset } = req.query;

      const rows = await notificationRepository.listForUser(
        userId,
        role as AudienceRole,
        {
          onlyUnread:
            String(onlyUnread ?? '').toLowerCase() === 'true' ||
            String(onlyUnread ?? '') === '1',
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined,
        }
      );

      res.status(200).json({ items: rows, total: rows.length });
    } catch (error) {
      next(error);
    }
  },

  async unreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, role } = req.user!;
      const count = await notificationRepository.unreadCountForUser(
        userId,
        role as AudienceRole
      );
      res.status(200).json({ count });
    } catch (error) {
      next(error);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, role } = req.user!;
      const id = Number(req.params.id);
      await notificationRepository.markAsRead(id, userId, role as AudienceRole);
      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  },

  async markAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, role } = req.user!;
      await notificationRepository.markAllAsRead(userId, role as AudienceRole);
      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  },
};
