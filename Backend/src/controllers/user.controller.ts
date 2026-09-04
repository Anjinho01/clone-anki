import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service';
import authService from '../services/auth.service';
import type { RoleName } from '../models/user.model';

const userController = {
  /**
   * POST /users — Admin cria novo usuário
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.createUser(
        req.body,
        req.user!.userId,
        req.user!.role as RoleName
      );
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /users — Listar usuários com paginação e filtros
   * Retorna { data: User[], pagination: { page, limit, totalPages, totalRecords } }
   * sem wrapper success para compatibilidade com o frontend
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page   = parseInt((req.query.page   as string) || '1',  10);
      const limit  = parseInt((req.query.limit  as string) || '30', 10);
      const status = (req.query.status  as string) || undefined;
      const roles  = (req.query.roles   as string) || undefined;
      const search = (req.query.search  as string) || undefined;

      const result = await userService.listUsers({ page, limit, status, roles, search });

      res.json({
        data: result.users,
        pagination: {
          page:         result.page,
          limit:        result.limit,
          totalPages:   result.totalPages,
          totalRecords: result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /users/:id — Buscar usuário por ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const user = await userService.getUserById(id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /users/:id — Atualizar usuário (admin)
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);

      // normaliza actived → isActive (campo enviado pelo frontend)
      const body = { ...req.body };
      if (body.actived !== undefined && body.isActive === undefined) {
        body.isActive = typeof body.actived === 'boolean' ? body.actived : body.actived === 1;
      }

      const user = await userService.updateUser(
        id,
        body,
        req.user!.userId,
        req.user!.role as RoleName
      );
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /users/:id/toggle-active — Ativar/desativar usuário
   */
  async toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const { isActive } = req.body;
      const user = await userService.toggleActive(
        id,
        isActive,
        req.user!.userId,
        req.user!.role as RoleName
      );
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /users/profile — Perfil do usuário autenticado (rota legada)
   */
  async profile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getProfile(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /users/me — Perfil do usuário autenticado
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getProfile(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /users/me — Atualiza nome/email do próprio usuário
   */
  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email } = req.body;
      const user = await userService.updateMe(req.user!.userId, { name, email });
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /users/me/reset-password — Usuário troca a própria senha
   */
  async resetPasswordMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await userService.resetPasswordMe(
        req.user!.userId,
        currentPassword,
        newPassword
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /users/:id/reset-password — Admin redefine senha de um usuário
   */
  async resetPasswordById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const { newPassword } = req.body;
      const result = await userService.resetPasswordById(id, newPassword);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};

export default userController;
