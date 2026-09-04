import { Request, Response, NextFunction } from 'express';
import packageService from '../services/package.service';
import type { RoleName } from '../models/user.model';

const packageController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const packages = await packageService.getAll(
        req.user!.userId,
        req.user!.role as RoleName
      );
      res.json({ success: true, data: packages });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const key = req.params.key as string;
      const pkg = await packageService.getByKey(
        key,
        req.user!.userId,
        req.user!.role as RoleName
      );
      res.json({ success: true, data: pkg });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pkg = await packageService.create(
        req.user!.userId,
        req.user!.role as RoleName,
        req.body
      );
      res.status(201).json({ success: true, data: pkg });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const pkg = await packageService.update(
        id,
        req.user!.userId,
        req.user!.role as RoleName,
        req.body
      );
      res.json({ success: true, data: pkg });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      await packageService.delete(id, req.user!.userId, req.user!.role as RoleName);
      res.json({ success: true, message: 'Package excluído com sucesso' });
    } catch (error) {
      next(error);
    }
  },
};

export default packageController;
