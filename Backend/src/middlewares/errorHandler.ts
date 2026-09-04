import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/httpError';
import logger from '../config/logger';

/**
 * Handler global de erros — padrão centralizado de todos os projetos
 * Captura HttpError, erros de JWT, validação, MySQL e genéricos
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // HttpError (operacional)
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: { message: 'Token inválido', statusCode: 401 },
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: { message: 'Token expirado', statusCode: 401 },
    });
    return;
  }

  // SyntaxError (JSON malformado)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: { message: 'JSON inválido no corpo da requisição', statusCode: 400 },
    });
    return;
  }

  // MySQL errors — nunca expor sqlMessage ao client (padrão ade90)
  if ('code' in err && typeof (err as Record<string, unknown>).code === 'string') {
    const code = (err as Record<string, unknown>).code as string;
    const sqlMessage = (err as Record<string, unknown>).sqlMessage;

    if (code.startsWith('ER_')) {
      logger.error(`Database error: ${code} - ${sqlMessage}`, {
        method: req.method,
        url: req.originalUrl,
      });
    }

    if (code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        success: false,
        error: { message: 'Registro duplicado', statusCode: 409 },
      });
      return;
    }

    if (code === 'ER_NO_REFERENCED_ROW_2' || code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({
        success: false,
        error: { message: 'Conflito de integridade referencial', statusCode: 409 },
      });
      return;
    }

    // Qualquer outro erro MySQL → resposta genérica
    if (code.startsWith('ER_')) {
      res.status(500).json({
        success: false,
        error: { message: 'Erro no banco de dados', statusCode: 500 },
      });
      return;
    }
  }

  // Erro inesperado
  logger.error('Erro não tratado', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  // Nunca expor detalhes internos em produção (padrão ade90)
  res.status(500).json({
    success: false,
    error: {
      message: 'Erro interno do servidor',
      statusCode: 500,
    },
  });
}

/**
 * Handler 404 para rotas não encontradas
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: `Rota ${req.method} ${req.originalUrl} não encontrada`,
      statusCode: 404,
    },
  });
}
