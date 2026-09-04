import { Request, Response, NextFunction } from 'express';
import reviewService from '../services/review.service';

const reviewController = {
  /**
   * GET /reviews/study/:deckId — buscar cards para sessão de estudo
   */
  async getStudySession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deckId = parseInt(req.params.deckId as string, 10);
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const cards = await reviewService.getStudySession(deckId, req.user!.userId, limit);
      res.json({ success: true, data: cards });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /reviews/preview/:cardId — preview dos intervalos para cada rating
   */
  async previewCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cardId = parseInt(req.params.cardId as string, 10);
      const preview = await reviewService.previewCard(cardId, req.user!.userId);
      res.json({ success: true, data: preview });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /reviews — submeter avaliação de um card
   */
  async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reviewService.submitReview(req.user!.userId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /reviews/stats — estatísticas de estudo
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const stats = await reviewService.getStats(req.user!.userId, days);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /reviews/history/:cardId — histórico de reviews de um card
   */
  async getCardHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cardId = parseInt(req.params.cardId as string, 10);
      const history = await reviewService.getCardHistory(cardId, req.user!.userId);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /reviews/undo — desfazer o último review de um card
   */
  async undoReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cardId = parseInt(req.body.cardId as string, 10);
      const result = await reviewService.undoLastReview(cardId, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};

export default reviewController;
