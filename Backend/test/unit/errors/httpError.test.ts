/**
 * HTTP Error Classes Tests
 */

import {
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  InternalError,
} from '../../../src/errors/httpError';

describe('HttpError', () => {
  it('deve criar erro com propriedades corretas', () => {
    const error = new HttpError(404, 'Não encontrado');

    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Não encontrado');
    expect(error.isOperational).toBe(true);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HttpError);
  });

  it('deve ter isOperational=true por padrão', () => {
    const error = new HttpError(500, 'Erro interno');
    expect(error.isOperational).toBe(true);
  });

  it('deve aceitar isOperational=false', () => {
    const error = new HttpError(500, 'Erro inesperado', false);
    expect(error.isOperational).toBe(false);
  });

  it('deve ter stack trace', () => {
    const error = new HttpError(400, 'Bad request');
    expect(error.stack).toBeDefined();
  });
});

describe('BadRequestError', () => {
  it('deve criar com status 400', () => {
    const error = new BadRequestError();
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Requisição inválida');
    expect(error).toBeInstanceOf(HttpError);
  });

  it('deve aceitar mensagem customizada', () => {
    const error = new BadRequestError('Campo inválido');
    expect(error.message).toBe('Campo inválido');
  });
});

describe('UnauthorizedError', () => {
  it('deve criar com status 401', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Não autorizado');
  });

  it('deve aceitar mensagem customizada', () => {
    const error = new UnauthorizedError('Token inválido');
    expect(error.message).toBe('Token inválido');
  });
});

describe('ForbiddenError', () => {
  it('deve criar com status 403', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Acesso negado');
  });

  it('deve aceitar mensagem customizada', () => {
    const error = new ForbiddenError('Permissão insuficiente');
    expect(error.message).toBe('Permissão insuficiente');
  });
});

describe('NotFoundError', () => {
  it('deve criar com status 404', () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Recurso não encontrado');
  });

  it('deve aceitar mensagem customizada', () => {
    const error = new NotFoundError('Usuário não encontrado');
    expect(error.message).toBe('Usuário não encontrado');
  });
});

describe('ConflictError', () => {
  it('deve criar com status 409', () => {
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Conflito de dados');
  });

  it('deve aceitar mensagem customizada', () => {
    const error = new ConflictError('Email já cadastrado');
    expect(error.message).toBe('Email já cadastrado');
  });
});

describe('TooManyRequestsError', () => {
  it('deve criar com status 429', () => {
    const error = new TooManyRequestsError();
    expect(error.statusCode).toBe(429);
    expect(error.message).toContain('Muitas requisições');
  });
});

describe('InternalError', () => {
  it('deve criar com status 500 e isOperational=false', () => {
    const error = new InternalError();
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Erro interno do servidor');
    expect(error.isOperational).toBe(false);
  });
});
