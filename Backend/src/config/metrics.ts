/**
 * Prometheus metrics
 *
 * Expõe métricas via /metrics (protegido por auth + role admin).
 * Instrumenta: HTTP requests, DB queries, logins, erros, conexões ativas.
 */
import client from 'prom-client';

// Prefixo global para todas as métricas
const prefix = 'flashcards_';

// Coleta default do Node.js (event loop, GC, memory, handles, etc.)
client.collectDefaultMetrics({ prefix });

// ─── HTTP ──────────────────────────────────────────────────────

export const httpRequestDuration = new client.Histogram({
  name: `${prefix}http_request_duration_seconds`,
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export const httpRequestsTotal = new client.Counter({
  name: `${prefix}http_requests_total`,
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'route', 'status_code'] as const,
});

// ─── Auth ──────────────────────────────────────────────────────

export const loginsTotal = new client.Counter({
  name: `${prefix}logins_total`,
  help: 'Total de logins bem-sucedidos',
});

export const loginFailedTotal = new client.Counter({
  name: `${prefix}login_failed_total`,
  help: 'Total de logins falhados',
});

// ─── Database ──────────────────────────────────────────────────

export const dbQueryDuration = new client.Histogram({
  name: `${prefix}db_query_duration_seconds`,
  help: 'Duração das queries SQL em segundos',
  labelNames: ['operation', 'table'] as const,
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
});

export const activeConnections = new client.Gauge({
  name: `${prefix}active_connections`,
  help: 'Conexões ativas no pool MySQL',
  labelNames: ['state'] as const,
});

// ─── API Errors ────────────────────────────────────────────────

export const apiErrorsTotal = new client.Counter({
  name: `${prefix}api_errors_total`,
  help: 'Total de erros da API por endpoint e tipo',
  labelNames: ['endpoint', 'error_type'] as const,
});

// ─── Helpers ───────────────────────────────────────────────────

export function recordDbQuery(operation: string, table: string, durationMs: number): void {
  dbQueryDuration.labels(operation, table).observe(durationMs / 1000);
}

export function setActiveConnections(active: number, total: number): void {
  activeConnections.labels('active').set(active);
  activeConnections.labels('total').set(total);
}

export function recordLogin(success: boolean): void {
  if (success) loginsTotal.inc();
  else loginFailedTotal.inc();
}

export function recordApiError(endpoint: string, errorType: string): void {
  apiErrorsTotal.labels(endpoint, errorType).inc();
}

// Registry export para GET /metrics
export const register = client.register;
