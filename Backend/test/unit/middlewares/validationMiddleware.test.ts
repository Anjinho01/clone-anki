/**
 * Validation Middleware Tests
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { validationMiddleware } from '../../../src/middlewares/validationMiddleware';

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('deve chamar next() quando não há erros de validação', () => {
    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([]),
    });

    validationMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('deve retornar 422 com erros quando validação falha', () => {
    const mockErrors = [
      { msg: 'Email inválido', path: 'email' },
      { msg: 'Senha obrigatória', path: 'password' },
    ];

    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue(mockErrors),
    });

    validationMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Erro de validação',
        statusCode: 422,
        details: [
          { field: 'email', message: 'Email inválido' },
          { field: 'password', message: 'Senha obrigatória' },
        ],
      },
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
