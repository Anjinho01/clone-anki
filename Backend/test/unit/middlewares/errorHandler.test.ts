/**
 * Error Handler Middleware Tests
 */

import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from '../../../src/middlewares/errorHandler';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../../src/errors/httpError';

// Mock do logger para evitar output nos testes
jest.mock('../../../src/config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

function createMockReqRes() {
  const req: Partial<Request> = {
    method: 'POST',
    originalUrl: '/test',
    ip: '127.0.0.1',
  };
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next: NextFunction = jest.fn();
  return { req: req as Request, res: res as Response, next };
}

describe('Error Handler Middleware', () => {
  describe('errorHandler', () => {
    it('deve tratar HttpError com status e mensagem corretos', () => {
      const { req, res, next } = createMockReqRes();
      const error = new BadRequestError('Campo obrigatório');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Campo obrigatório', statusCode: 400 },
      });
    });

    it('deve tratar UnauthorizedError (401)', () => {
      const { req, res, next } = createMockReqRes();
      const error = new UnauthorizedError('Token inválido');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Token inválido', statusCode: 401 },
      });
    });

    it('deve tratar NotFoundError (404)', () => {
      const { req, res, next } = createMockReqRes();
      const error = new NotFoundError('Deck não encontrado');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deve tratar JsonWebTokenError como 401', () => {
      const { req, res, next } = createMockReqRes();
      const error = new Error('jwt malformed');
      error.name = 'JsonWebTokenError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Token inválido', statusCode: 401 },
      });
    });

    it('deve tratar TokenExpiredError como 401', () => {
      const { req, res, next } = createMockReqRes();
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Token expirado', statusCode: 401 },
      });
    });

    it('deve tratar SyntaxError de JSON inválido como 400', () => {
      const { req, res, next } = createMockReqRes();
      const error = new SyntaxError('Unexpected token') as SyntaxError & { body: unknown };
      (error as any).body = {};

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'JSON inválido no corpo da requisição', statusCode: 400 },
      });
    });

    it('deve tratar ER_DUP_ENTRY como 409', () => {
      const { req, res, next } = createMockReqRes();
      const error = new Error('Duplicate entry') as Error & { code: string; sqlMessage: string };
      (error as any).code = 'ER_DUP_ENTRY';
      (error as any).sqlMessage = "Duplicate entry 'test@email.com'";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Registro duplicado', statusCode: 409 },
      });
    });

    it('deve tratar ER_NO_REFERENCED_ROW_2 como 409', () => {
      const { req, res, next } = createMockReqRes();
      const error = new Error('Foreign key') as Error & { code: string };
      (error as any).code = 'ER_NO_REFERENCED_ROW_2';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('deve tratar outros erros MySQL como 500 sem expor sqlMessage', () => {
      const { req, res, next } = createMockReqRes();
      const error = new Error('MySQL error') as Error & { code: string; sqlMessage: string };
      (error as any).code = 'ER_ACCESS_DENIED_ERROR';
      (error as any).sqlMessage = 'Access denied for user';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Erro no banco de dados', statusCode: 500 },
      });
    });

    it('deve tratar erro genérico como 500', () => {
      const { req, res, next } = createMockReqRes();
      const error = new Error('Something unexpected');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Erro interno do servidor', statusCode: 500 },
      });
    });
  });

  describe('notFoundHandler', () => {
    it('deve retornar 404 com a rota tentada', () => {
      const req: Partial<Request> = {
        method: 'GET',
        originalUrl: '/rota/inexistente',
      };
      const res: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      notFoundHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Rota GET /rota/inexistente não encontrada',
          statusCode: 404,
        },
      });
    });
  });
});
