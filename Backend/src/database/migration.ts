import { initDatabase, closeDatabase } from '../config/database';
import logger from '../config/logger';

import { runUsersMigration } from './users.migration';
import { runDecksMigration } from './decks.migration';
import { runPackagesMigration } from './packages.migration';
import { runCardsMigration } from './cards.migration';
import { runReviewLogsMigration } from './reviewLogs.migration';
import { runSyncMigration } from './sync.migration';
import { runActivityLogsMigration } from './activityLogs.migration';
import { runNotificationsMigration } from './notifications.migration';
import { runPublicUuidMigration } from './publicUuid.migration';
import { runBrainscapeImportMigration } from './brainscapeImport.migration';

/**
 * Runner de migrations — executa na ordem correta (respeitando FK)
 * Uso: npm run migration
 */
async function runMigrations(): Promise<void> {
  logger.info('Iniciando migrations...');

  try {
    initDatabase();

    // Ordem importa — FKs dependem de tabelas anteriores
    await runUsersMigration();
    await runDecksMigration();
    await runPackagesMigration();    // tb_packages depende de tb_users
    await runCardsMigration();       // tb_cards depende de tb_decks + tb_packages + tb_users
    await runPublicUuidMigration();  // UUID público para decks, grupos e cards reutilizáveis
    await runBrainscapeImportMigration(); // importa packs/decks/cards exportados do Brainscape
    await runReviewLogsMigration();  // tb_review_logs depende de tb_cards + tb_users
    await runSyncMigration();
    await runActivityLogsMigration();
    await runNotificationsMigration();

    logger.info('Todas as migrations executadas com sucesso ✓');
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Erro ao executar migrations', {
        message: error.message,
        stack: error.stack,
      });
    } else {
      logger.error('Erro ao executar migrations', { error });
    }
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

runMigrations();

