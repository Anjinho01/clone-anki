/**
 * Metrics middleware — padrão ade90
 *
 * Monkey-patches res.end() para capturar duração e status code
 * de cada requisição HTTP e alimentar métricas Prometheus.
 *
 * Ignora: /metrics, /healthz, /health
 */
import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestsTotal } from '../config/metrics';

const SKIP_PATHS = new Set(['/metrics', '/healthz', '/health']);

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (SKIP_PATHS.has(req.path)) return next();

  const start = process.hrtime.bigint();
  const originalEnd = res.end;

  // @ts-expect-error — monkey-patch de res.end para capturar timing
  res.end = function (...args: Parameters<typeof originalEnd>) {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationSec = durationNs / 1e9;

    // Normaliza route para evitar cardinalidade alta (IDs → :id)
    const route = normalizeRoute(req.route?.path || req.path, req.baseUrl);
    const statusCode = String(res.statusCode);
    const method = req.method;

    httpRequestDuration.labels(method, route, statusCode).observe(durationSec);
    httpRequestsTotal.labels(method, route, statusCode).inc();

    return originalEnd.apply(this, args);
  };

  next();
}

/**
 * Normaliza a rota para métricas, substituindo IDs numéricos e UUIDs
 * por :id para manter baixa a cardinalidade dos labels.
 */
function normalizeRoute(routePath: string, baseUrl: string): string {
  const full = `${baseUrl}${routePath}`.replace(/\/+/g, '/');

  return full
    // UUIDs
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id'
    )
    // IDs numéricos
    .replace(/\/\d+/g, '/:id');
}
