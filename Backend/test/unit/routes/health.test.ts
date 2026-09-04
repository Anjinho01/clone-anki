/**
 * Health Route Tests
 *
 * Testa /health e /healthz usando mock do database.
 * Padrão Argyx: Express app isolado com supertest.
 */

import express from 'express';
import request from 'supertest';

// Mock do módulo database
jest.mock('../../../src/config/database', () => ({
  healthCheck: jest.fn(),
  getActiveConnections: jest.fn(),
}));

import { healthCheck, getActiveConnections } from '../../../src/config/database';

const mockedHealthCheck = healthCheck as jest.MockedFunction<typeof healthCheck>;
const mockedGetActiveConnections = getActiveConnections as jest.MockedFunction<typeof getActiveConnections>;

// Express app isolado (só as rotas que queremos testar)
function createHealthApp() {
  const app = express();

  app.get('/health', async (_req, res) => {
    const dbHealthy = await healthCheck();
    const connections = await getActiveConnections();
    const status = dbHealthy ? 200 : 503;

    res.status(status).json({
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: {
        connected: dbHealthy,
        activeConnections: connections,
      },
    });
  });

  app.get('/healthz', (_req, res) => {
    res.status(200).send('OK');
  });

  return app;
}

describe('Health Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createHealthApp();
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('deve retornar 200 quando DB está saudável', async () => {
      mockedHealthCheck.mockResolvedValue(true);
      mockedGetActiveConnections.mockResolvedValue(5);

      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database.connected).toBe(true);
      expect(res.body.database.activeConnections).toBe(5);
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('environment');
    });

    it('deve retornar 503 quando DB está indisponível', async () => {
      mockedHealthCheck.mockResolvedValue(false);
      mockedGetActiveConnections.mockResolvedValue(0);

      const res = await request(app).get('/health');

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('unhealthy');
      expect(res.body.database.connected).toBe(false);
    });
  });

  describe('GET /healthz', () => {
    it('deve retornar 200 OK', async () => {
      const res = await request(app).get('/healthz');

      expect(res.status).toBe(200);
      expect(res.text).toBe('OK');
    });
  });
});
