import { Request, Response, NextFunction } from 'express';
import libraryCardService from '../services/libraryCard.service';
import cardService from '../services/card.service';
import type { RoleName } from '../models/user.model';
import { parsePagination } from '../interfaces/pagination.interface';

const libraryCardController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = parsePagination(req.query.page as string, req.query.limit as string);
      const result = await libraryCardService.getAll(req.user!.userId, req.user!.role as RoleName, {
        ...pagination,
        search: req.query.search as string | undefined,
      });
      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.pagination.page,
          limit: result.pagination.limit,
          totalPages: result.pagination.totalPages,
          totalRecords: result.pagination.total,
        },
        limits: result.limits,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const key = req.params.key as string;
      const card = await libraryCardService.getByKey(
        key,
        req.user!.userId,
        req.user!.role as RoleName
      );
      res.json({ success: true, data: card });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const card = await libraryCardService.create(
        req.user!.userId,
        req.user!.role as RoleName,
        req.body
      );
      res.status(201).json({ success: true, data: card });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const card = await libraryCardService.update(
        id,
        req.user!.userId,
        req.user!.role as RoleName,
        req.body
      );
      res.json({ success: true, data: card });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      await libraryCardService.delete(id, req.user!.userId, req.user!.role as RoleName);
      res.json({ success: true, message: 'Card excluído com sucesso' });
    } catch (error) {
      next(error);
    }
  },

  async addToDeck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cardId = parseInt(req.params.id as string, 10);
      const deckId = parseInt(req.params.deckId as string, 10);
      await cardService.addCardToDeck(deckId, cardId, req.user!.userId, req.user!.role as RoleName);
      res.json({ success: true, message: 'Card adicionado ao deck' });
    } catch (error) {
      next(error);
    }
  },

  async removeFromDeck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cardId = parseInt(req.params.id as string, 10);
      const deckId = parseInt(req.params.deckId as string, 10);
      await cardService.removeCardFromDeck(
        deckId,
        cardId,
        req.user!.userId,
        req.user!.role as RoleName
      );
      res.json({ success: true, message: 'Card removido do deck' });
    } catch (error) {
      next(error);
    }
  },
};

export default libraryCardController;