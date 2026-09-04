import mysql, { Pool, PoolConnection, PoolOptions, RowDataPacket } from 'mysql2/promise';
import { Request } from 'express';
import env from './env';
import logger from './logger';
import { recordDbQuery, setActiveConnections } from './metrics';

let pool: Pool;
let connectionPollInterval: ReturnType<typeof setInterval> | null = null;

const poolConfig: PoolOptions = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: env.DB_CONNECT_TIMEOUT,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  timezone: '-03:00',
  dateStrings: false,
};

export function initDatabase(): Pool {
  pool = mysql.createPool(poolConfig);

  pool.on('connection', () => {
    logger.debug('Nova conexão MySQL criada no pool');
  });

  // Instrumentar pool para métricas Prometheus
  instrumentPool(pool);

  // Polling de conexões ativas a cada 10s
  connectionPollInterval = setInterval(() => pollActiveConnections(), 10_000);

  logger.info('Pool de conexões MySQL inicializado', {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    connectionLimit: env.DB_CONNECTION_LIMIT,
  });

  return pool;
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Pool MySQL não inicializado. Chame initDatabase() primeiro.');
  }
  return pool;
}

/**
 * Ping no boot para fail-fast se o banco está inacessível — padrão ade90
 */
export async function pingDatabase(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    logger.info('Ping MySQL OK');
  } finally {
    conn.release();
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    logger.error('Falha no healthcheck do MySQL', { error });
    return false;
  }
}

export async function getActiveConnections(): Promise<number> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW STATUS LIKE 'Threads_connected'"
    );
    return parseInt(rows[0]?.Value || '0', 10);
  } catch {
    return -1;
  }
}

export async function closeDatabase(): Promise<void> {
  if (connectionPollInterval) {
    clearInterval(connectionPollInterval);
    connectionPollInterval = null;
  }
  if (pool) {
    await pool.end();
    logger.info('Pool de conexões MySQL encerrado');
  }
}

// ─── DB Pool Instrumentation — padrão ade90 ────────────────────

/**
 * Wraps pool.query e pool.execute para capturar duração em Prometheus.
 * Extrai operação (SELECT/INSERT/UPDATE/DELETE) e tabela do SQL.
 */
function instrumentPool(p: Pool): void {
  const originalQuery = p.query.bind(p);
  const originalExecute = p.execute.bind(p);

  // @ts-expect-error — monkey-patch
  p.query = async function (...args: Parameters<typeof originalQuery>) {
    const start = Date.now();
    try {
      const result = await originalQuery(...args);
      recordQueryMetric(args[0], Date.now() - start);
      return result;
    } catch (error) {
      recordQueryMetric(args[0], Date.now() - start);
      throw error;
    }
  };

  // @ts-expect-error — monkey-patch
  p.execute = async function (...args: Parameters<typeof originalExecute>) {
    const start = Date.now();
    try {
      const result = await originalExecute(...args);
      recordQueryMetric(args[0], Date.now() - start);
      return result;
    } catch (error) {
      recordQueryMetric(args[0], Date.now() - start);
      throw error;
    }
  };
}

/**
 * Instrumento para conexão individual (usado em withSession).
 */
function instrumentConnection(conn: PoolConnection): void {
  const originalQuery = conn.query.bind(conn);
  const originalExecute = conn.execute.bind(conn);

  // @ts-expect-error — monkey-patch
  conn.query = async function (...args: Parameters<typeof originalQuery>) {
    const start = Date.now();
    try {
      const result = await originalQuery(...args);
      recordQueryMetric(args[0], Date.now() - start);
      return result;
    } catch (error) {
      recordQueryMetric(args[0], Date.now() - start);
      throw error;
    }
  };

  // @ts-expect-error — monkey-patch
  conn.execute = async function (...args: Parameters<typeof originalExecute>) {
    const start = Date.now();
    try {
      const result = await originalExecute(...args);
      recordQueryMetric(args[0], Date.now() - start);
      return result;
    } catch (error) {
      recordQueryMetric(args[0], Date.now() - start);
      throw error;
    }
  };
}

function recordQueryMetric(sql: unknown, durationMs: number): void {
  if (typeof sql !== 'string') return;
  const { operation, table } = parseSql(sql);
  recordDbQuery(operation, table, durationMs);
}

function parseSql(sql: string): { operation: string; table: string } {
  const normalized = sql.trim().toUpperCase();
  const operationMatch = normalized.match(/^(SELECT|INSERT|UPDATE|DELETE|REPLACE|CALL|SET|SHOW|CREATE|ALTER|DROP)/);
  const operation = operationMatch?.[1] || 'OTHER';

  // Extrair nome da tabela
  const tablePatterns = [
    /FROM\s+`?(\w+)`?/i,
    /INTO\s+`?(\w+)`?/i,
    /UPDATE\s+`?(\w+)`?/i,
    /TABLE\s+`?(\w+)`?/i,
  ];

  for (const pattern of tablePatterns) {
    const match = sql.match(pattern);
    if (match) return { operation, table: match[1].toLowerCase() };
  }

  return { operation, table: 'unknown' };
}

// ─── withSession — padrão ade90 ────────────────────────────────

/**
 * Obtém uma conexão dedicada do pool, instrumenta, aplica limites
 * de execução e escuta abort do request.
 *
 * Uso:
 *   await withSession(req, async (conn) => {
 *     const [rows] = await conn.query('SELECT ...');
 *     // ...
 *   });
 */
export async function withSession<T>(
  req: Request | null,
  handler: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await pool.getConnection();
  instrumentConnection(conn);

  let destroyed = false;

  // Se request abortar, destruir a conexão (não devolver ao pool)
  const onAbort = () => {
    if (!destroyed) {
      destroyed = true;
      conn.destroy();
      logger.warn('Conexão MySQL destruída — request abortado');
    }
  };

  if (req) {
    req.on('close', () => {
      if (!req.complete) onAbort();
    });
  }

  try {
    // Tentar aplicar max_execution_time (MySQL 5.7.8+ / MariaDB 10.1.1+)
    await applySessionExecLimit(conn);
    return await handler(conn);
  } finally {
    if (!destroyed) {
      conn.release();
    }
  }
}

/**
 * Aplica limite de tempo de execução por sessão.
 * Tenta MySQL (max_execution_time) e depois MariaDB (max_statement_time).
 */
async function applySessionExecLimit(conn: PoolConnection): Promise<void> {
  try {
    // MySQL: max_execution_time (milissegundos)
    await conn.query('SET SESSION max_execution_time = 30000');
  } catch {
    try {
      // MariaDB: max_statement_time (segundos)
      await conn.query('SET SESSION max_statement_time = 30');
    } catch {
      // Servidor não suporta — seguir sem limite
    }
  }
}

// ─── Connection polling para Prometheus ────────────────────────

function pollActiveConnections(): void {
  try {
    // Acessar pool interno do mysql2
    const rawPool = (pool as unknown as { pool: { _freeConnections: unknown[]; _allConnections: unknown[] } }).pool;
    if (rawPool) {
      const free = rawPool._freeConnections?.length || 0;
      const total = rawPool._allConnections?.length || 0;
      const active = total - free;
      setActiveConnections(active, total);
    }
  } catch {
    // Pool interno não acessível — ignorar
  }
}

export default { initDatabase, getPool, pingDatabase, healthCheck, getActiveConnections, closeDatabase, withSession };
