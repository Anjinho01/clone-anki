/**
 * dateConverterMiddleware — padrão ade90
 *
 * Patches res.json() para converter automaticamente objetos Date do MySQL
 * para strings ISO-8601 no fuso de Brasília (-03:00).
 *
 * Isso garante que o frontend sempre receba datas como strings
 * consistentes, independente do timezone do servidor.
 */
import { Request, Response, NextFunction } from 'express';

export function dateConverterMiddleware(_req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);

  // @ts-ignore — monkey-patch de res.json
  res.json = function (body: unknown) {
    return originalJson(convertDates(body));
  };

  next();
}

/**
 * Converte recursivamente objetos Date para ISO-8601 em UTC.
 * Percorre objects e arrays para encontrar todas as datas.
 */
function convertDates(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertDates);
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = convertDates(value);
    }
    return result;
  }

  return obj;
}
