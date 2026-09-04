import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../errors/httpError';
import type { RoleName } from '../models/user.model';

// Estender Request para incluir dados do usuário autenticado
export interface AuthUser {
  userId: number;
  email: string;
  role: RoleName;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Verifica JWT no header Authorization: Bearer <token>
 * Padrão de todos os projetos
 */
export function verifyToken(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de acesso não fornecido');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }
    next(error);
  }
}

/**
 * Auth opcional — não bloqueia se não tiver token
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
      req.user = decoded;
    }

    next();
  } catch {
    // Token inválido/expirado — segue sem autenticar
    next();
  }
}

/**
 * RBAC — restringe por role
 * Padrão Kaizen/Quoti com perfis nomeados
 *
 * Hierarquia: develop > admin > monitor > user
 *   develop = super admin (acesso total)
 *   admin   = gerencia usuários, decks e cards
 *   monitor = gerencia conteúdo de estudo
 *   user    = aluno (apenas estuda)
 */
type Role = RoleName;

const roleProfiles: Record<string, Role[]> = {
  develop: ['develop'],
  admin: ['develop', 'admin'],
  monitor: ['develop', 'admin', 'monitor'],
  all: ['develop', 'admin', 'monitor', 'user'],
};

export function requireRole(roles: Role[] | string) {
  const allowedRoles: Role[] = typeof roles === 'string'
    ? roleProfiles[roles] || []
    : roles;

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Autenticação necessária'));
      return;
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      next(new ForbiddenError('Permissão insuficiente para esta ação'));
      return;
    }

    next();
  };
}
