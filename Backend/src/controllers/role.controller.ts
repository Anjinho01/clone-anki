import { Request, Response, NextFunction } from 'express';
import { roleService } from '../services/role.service';

export const roleController = {
  async getRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await roleService.getRoles();
      // Frontend expects { roleId, role } shape
      res.status(200).json({ data: roles.map((r) => ({ roleId: r.id, role: r.name })) });
    } catch (error) {
      next(error);
    }
  },

  async getRoleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params['id'] as string;
      const role = await roleService.getRoleById(parseInt(id, 10));
      res.status(200).json({ data: role });
    } catch (error) {
      next(error);
    }
  },
};
