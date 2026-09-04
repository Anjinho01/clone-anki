import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import logger from './config/logger';
import env from './config/env';

interface SwaggerDoc {
  paths?: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export function setupSwagger(app: Express): void {
  try {
    if (!env.ENABLE_SWAGGER) {
      logger.info('Swagger desabilitado por configuracao de ambiente.');
      return;
    }

    const docsDir = path.resolve(__dirname, '../docs');

    if (!fs.existsSync(docsDir)) {
      logger.warn('Diretório docs/ não encontrado. Swagger desabilitado.');
      return;
    }

    const basePath = path.join(docsDir, 'base.yaml');
    if (!fs.existsSync(basePath)) {
      logger.warn('docs/base.yaml não encontrado. Swagger desabilitado.');
      return;
    }

    // Carregar documento base
    const baseDoc = yaml.load(fs.readFileSync(basePath, 'utf8')) as SwaggerDoc;

    if (!baseDoc.paths) baseDoc.paths = {};
    if (!baseDoc.components) baseDoc.components = {};
    if (!baseDoc.components.schemas) baseDoc.components.schemas = {};

    // Mergear todos os YAMLs adicionais
    const yamlFiles = fs
      .readdirSync(docsDir)
      .filter((f) => f.endsWith('.yaml') && f !== 'base.yaml')
      .sort();

    for (const file of yamlFiles) {
      const doc = yaml.load(
        fs.readFileSync(path.join(docsDir, file), 'utf8')
      ) as SwaggerDoc;

      if (doc.paths) {
        Object.assign(baseDoc.paths, doc.paths);
      }

      if (doc.components?.schemas) {
        Object.assign(baseDoc.components.schemas!, doc.components.schemas);
      }
    }

    app.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup(baseDoc, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Flashcards API Docs',
      })
    );

    logger.info(`Swagger UI disponível em /docs (${yamlFiles.length + 1} arquivo(s) YAML carregados)`);
  } catch (error) {
    logger.error('Erro ao configurar Swagger', { error });
  }
}
