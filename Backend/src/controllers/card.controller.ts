import { Request, Response, NextFunction } from 'express';
import cardService from '../services/card.service';

const cardController = {
  async getByDeck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deckId = parseInt(req.params.deckId as string, 10);
      const cards = await cardService.getByDeck(deckId, req.user!.userId);
      res.json({ success: true, data: cards });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const card = await cardService.getById(id, req.user!.userId);
      res.json({ success: true, data: card });
    } catch (error) {
      next(error);
    }
  },

  async suspend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await cardService.suspend(id, req.user!.userId);
      res.json({ success: true, message: 'Card suspenso', data: result });
    } catch (error) {
      next(error);
    }
  },

  async unsuspend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await cardService.unsuspend(id, req.user!.userId);
      res.json({ success: true, message: 'Card reativado', data: result });
    } catch (error) {
      next(error);
    }
  },

  async bury(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await cardService.bury(id, req.user!.userId);
      res.json({ success: true, message: 'Card enterrado até amanhã', data: result });
    } catch (error) {
      next(error);
    }
  },

  async unburyExpired(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deckId = parseInt(req.params.deckId as string, 10);
      const result = await cardService.unburyExpired(deckId, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};

export default cardController;
