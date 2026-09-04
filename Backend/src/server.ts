import http from 'http';
import app from './app';
import env, { validateEnv } from './config/env';
import { initDatabase, closeDatabase } from './config/database';
import logger from './config/logger';
import { startPurgeJobs } from './jobs/purge';

// Validar ambiente
validateEnv();

// Inicializar banco
initDatabase();

const server = http.createServer(app);

server.listen(env.PORT, env.HOST, () => {
  logger.info(`Servidor rodando em http://${env.HOST}:${env.PORT}`, {
    env: env.NODE_ENV,
    port: env.PORT,
  });

  // Iniciar jobs de limpeza periódica
  if (env.isProd()) {
    startPurgeJobs();
  }
});

// -- Graceful Shutdown (padrão Kaizen/Quoti/Ade90) ---------------------

const SHUTDOWN_TIMEOUT = 30_000;

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Recebido ${signal}. Iniciando shutdown graceful...`);

  const forceExit = setTimeout(() => {
    logger.error('Shutdown forçado após timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    // 1. Parar de aceitar novas conexões
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    logger.info('Servidor HTTP encerrado');

    // 2. Fechar pool do banco
    await closeDatabase();

    clearTimeout(forceExit);
    logger.info('Shutdown graceful concluído');
    process.exit(0);
  } catch (error) {
    logger.error('Erro durante shutdown', { error });
    clearTimeout(forceExit);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Exceção não capturada', { error: error.message, stack: error.stack });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Promise rejeitada não tratada', { reason });
  gracefulShutdown('unhandledRejection');
});

export default server;
