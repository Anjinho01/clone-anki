import { Request, Response, NextFunction } from 'express';
import deckService from '../services/deck.service';
import type { RoleName } from '../models/user.model';

const deckController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const decks = await deckService.getAll(req.user!.userId, req.user!.role as RoleName);
      res.json({ success: true, data: decks });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const key = req.params.key as string;
      const deck = await deckService.getByKey(key, req.user!.userId, req.user!.role as RoleName);
      res.json({ success: true, data: deck });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deck = await deckService.create(req.user!.userId, req.user!.role as RoleName, req.body);
      res.status(201).json({ success: true, data: deck });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const deck = await deckService.update(id, req.user!.userId, req.user!.role as RoleName, req.body);
      res.json({ success: true, data: deck });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      await deckService.delete(id, req.user!.userId, req.user!.role as RoleName);
      res.json({ success: true, data: { message: 'Deck excluído com sucesso' } });
    } catch (error) {
      next(error);
    }
  },

};

export default deckController;
