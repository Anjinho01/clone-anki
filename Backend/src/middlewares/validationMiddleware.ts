import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware de validação — padrão de todos os projetos
 * Processa resultado do express-validator e retorna 422 com detalhes
 */
export function validationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      error: {
        message: 'Erro de validação',
        statusCode: 422,
        details: errors.array().map((err) => ({
          field: 'path' in err ? err.path : undefined,
          message: err.msg,
        })),
      },
    });
    return;
  }

  next();
}
