/**
 * Hierarquia de erros HTTP — padrão Argyx com extensões
 */
export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Requisição inválida') {
    super(400, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Não autorizado') {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Acesso negado') {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Recurso não encontrado') {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflito de dados') {
    super(409, message);
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message = 'Muitas requisições. Tente novamente mais tarde.') {
    super(429, message);
  }
}

export class InternalError extends HttpError {
  constructor(message = 'Erro interno do servidor') {
    super(500, message, false);
  }
}
