import { Request, Response, NextFunction } from 'express';
import syncService from '../services/sync.service';

const syncController = {
  /**
   * POST /sync — endpoint principal de sincronização
   * O mobile envia suas mudanças offline e recebe as do servidor
   */
  async sync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await syncService.sync(req.user!.userId, req.body);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default syncController;
