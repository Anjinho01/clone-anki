/**
 * Auth Middleware Tests
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken, optionalAuth, requireRole } from '../../../src/middlewares/authMiddleware';
import env from '../../../src/config/env';

describe('Auth Middleware', () => {
  function createMockReqRes(headers: Record<string, string> = {}) {
    const req: Partial<Request> = {
      headers: headers as any,
    };
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next: NextFunction = jest.fn();
    return { req: req as Request, res: res as Response, next };
  }

  const validPayload = { userId: 1, email: 'test@test.com', role: 'user' };
  const validToken = jwt.sign(validPayload, env.JWT_SECRET, { expiresIn: '1h' });

  describe('verifyToken', () => {
    it('deve autenticar com token válido', () => {
      const { req, res, next } = createMockReqRes({
        authorization: `Bearer ${validToken}`,
      });

      verifyToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user!.userId).toBe(1);
      expect(req.user!.email).toBe('test@test.com');
      expect(req.user!.role).toBe('user');
    });

    it('deve falhar sem Authorization header', () => {
      const { req, res, next } = createMockReqRes({});

      verifyToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('deve falhar sem prefixo Bearer', () => {
      const { req, res, next } = createMockReqRes({
        authorization: validToken,
      });

      verifyToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('deve falhar com token inválido', () => {
      const { req, res, next } = createMockReqRes({
        authorization: 'Bearer token_invalido',
      });

      verifyToken(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('deve falhar com token expirado', () => {
      const expiredToken = jwt.sign(validPayload, env.JWT_SECRET, { expiresIn: '0s' });
      const { req, res, next } = createMockReqRes({
        authorization: `Bearer ${expiredToken}`,
      });

      // Delay para garantir expiração
      setTimeout(() => {
        verifyToken(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
      }, 10);
    });
  });

  describe('optionalAuth', () => {
    it('deve setar user se token válido', () => {
      const { req, res, next } = createMockReqRes({
        authorization: `Bearer ${validToken}`,
      });

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user!.userId).toBe(1);
    });

    it('deve chamar next() sem user se nenhum token', () => {
      const { req, res, next } = createMockReqRes({});

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('deve chamar next() sem user se token inválido', () => {
      const { req, res, next } = createMockReqRes({
        authorization: 'Bearer invalid_token',
      });

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });

  describe('requireRole', () => {
    it('deve permitir acesso com role permitida', () => {
      const middleware = requireRole(['admin', 'user']);
      const { req, res, next } = createMockReqRes();
      req.user = { userId: 1, email: 'test@test.com', role: 'user' };

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('deve negar acesso com role não permitida', () => {
      const middleware = requireRole(['admin']);
      const { req, res, next } = createMockReqRes();
      req.user = { userId: 1, email: 'test@test.com', role: 'user' };

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });

    it('deve retornar 401 se não autenticado', () => {
      const middleware = requireRole(['admin']);
      const { req, res, next } = createMockReqRes();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('deve aceitar string de perfil (admin) — inclui develop e admin', () => {
      const middleware = requireRole('admin');

      // develop deve ter acesso
      const ctx1 = createMockReqRes();
      ctx1.req.user = { userId: 1, email: 'dev@test.com', role: 'develop' };
      middleware(ctx1.req, ctx1.res, ctx1.next);
      expect(ctx1.next).toHaveBeenCalledWith();

      // admin deve ter acesso
      const ctx2 = createMockReqRes();
      ctx2.req.user = { userId: 2, email: 'admin@test.com', role: 'admin' };
      middleware(ctx2.req, ctx2.res, ctx2.next);
      expect(ctx2.next).toHaveBeenCalledWith();

      // user NÃO deve ter acesso
      const ctx3 = createMockReqRes();
      ctx3.req.user = { userId: 3, email: 'user@test.com', role: 'user' };
      middleware(ctx3.req, ctx3.res, ctx3.next);
      expect(ctx3.next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });

    it('deve aceitar string de perfil (monitor) — inclui develop, admin e monitor', () => {
      const middleware = requireRole('monitor');

      for (const role of ['develop', 'admin', 'monitor'] as const) {
        const { req, res, next } = createMockReqRes();
        req.user = { userId: 1, email: 'test@test.com', role };
        middleware(req, res, next);
        expect(next).toHaveBeenCalledWith();
      }

      const denied = createMockReqRes();
      denied.req.user = { userId: 2, email: 'user@test.com', role: 'user' };
      middleware(denied.req, denied.res, denied.next);
      expect(denied.next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });

    it('deve aceitar string de perfil (all) — inclui todas as roles', () => {
      const middleware = requireRole('all');

      for (const role of ['develop', 'admin', 'monitor', 'user'] as const) {
        const { req, res, next } = createMockReqRes();
        req.user = { userId: 1, email: 'test@test.com', role };
        middleware(req, res, next);
        expect(next).toHaveBeenCalledWith();
      }
    });

    it('deve aceitar string de perfil (develop) — somente develop', () => {
      const middleware = requireRole('develop');

      // develop deve ter acesso
      const ctx1 = createMockReqRes();
      ctx1.req.user = { userId: 1, email: 'dev@test.com', role: 'develop' };
      middleware(ctx1.req, ctx1.res, ctx1.next);
      expect(ctx1.next).toHaveBeenCalledWith();

      // admin NÃO deve ter acesso
      const ctx2 = createMockReqRes();
      ctx2.req.user = { userId: 2, email: 'admin@test.com', role: 'admin' };
      middleware(ctx2.req, ctx2.res, ctx2.next);
      expect(ctx2.next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });
  });
});
