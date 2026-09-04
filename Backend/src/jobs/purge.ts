import { RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import logger from '../config/logger';

/**
 * Job de limpeza de refresh tokens expirados/revogados
 * Padrão Kaizen/Quoti — usa GET_LOCK para evitar duplicação em cluster
 */
export async function refreshTokenPurge(): Promise<void> {
  const pool = getPool();
  const lockName = 'flashcards_refresh_purge';

  try {
    // Adquirir lock (10s timeout)
    const [lockResult] = await pool.query<(RowDataPacket & { lock_acquired: number })[]>(
      `SELECT GET_LOCK(?, 10) as lock_acquired`,
      [lockName]
    );

    if (!lockResult[0]?.lock_acquired) {
      logger.debug('refresh purge: lock não adquirido, outra instância já está rodando');
      return;
    }

    try {
      const result = await pool.query(
        'DELETE FROM tb_refresh_tokens WHERE expires_at < NOW() OR is_revoked = TRUE'
      );

      const deleted = (result[0] as { affectedRows: number }).affectedRows;
      if (deleted > 0) {
        logger.info(`refresh purge: ${deleted} token(s) removido(s)`);
      }
    } finally {
      await pool.query('SELECT RELEASE_LOCK(?)', [lockName]);
    }
  } catch (error) {
    logger.error('Erro no refresh token purge', { error });
  }
}

/**
 * Job de limpeza do sync log antigo (> 90 dias)
 * Usa GET_LOCK para consistência com refreshTokenPurge em cluster
 */
export async function syncLogPurge(): Promise<void> {
  const pool = getPool();
  const lockName = 'flashcards_synclog_purge';

  try {
    const [lockResult] = await pool.query<(RowDataPacket & { lock_acquired: number })[]>(
      `SELECT GET_LOCK(?, 10) as lock_acquired`,
      [lockName]
    );

    if (!lockResult[0]?.lock_acquired) {
      logger.debug('sync log purge: lock não adquirido, outra instância já está rodando');
      return;
    }

    try {
      const result = await pool.query(
        'DELETE FROM tb_sync_log WHERE synced_at < DATE_SUB(NOW(), INTERVAL 90 DAY)'
      );

      const deleted = (result[0] as { affectedRows: number }).affectedRows;
      if (deleted > 0) {
        logger.info(`sync log purge: ${deleted} registro(s) removido(s)`);
      }
    } finally {
      await pool.query('SELECT RELEASE_LOCK(?)', [lockName]);
    }
  } catch (error) {
    logger.error('Erro no sync log purge', { error });
  }
}

// Rodar periodicamente (a cada 6 horas)
const SIX_HOURS = 6 * 60 * 60 * 1000;

export function startPurgeJobs(): void {
  // Executar imediatamente no boot e depois a cada 6 horas
  void refreshTokenPurge();
  void syncLogPurge();

  setInterval(refreshTokenPurge, SIX_HOURS);
  setInterval(syncLogPurge, SIX_HOURS);
  logger.info('Jobs de purge iniciados (imediato + a cada 6 horas)');
}
