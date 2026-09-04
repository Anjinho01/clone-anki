/**
 * Auth Routes Tests
 *
 * Padrão Argyx: Express app isolado com supertest + mocks de serviço/controller.
 * Testa validações das rotas, status HTTP e estrutura de resposta.
 *
 * Nota: signup foi removido — cadastro é feito apenas por admin via /users.
 */

import express from 'express';
import request from 'supertest';

// Mocks
jest.mock('../../../src/services/auth.service', () => ({
  __esModule: true,
  default: {
    signin: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    getProfile: jest.fn(),
    changePassword: jest.fn(),
  },
}));

jest.mock('../../../src/utils/recaptcha', () => ({
  verifyRecaptcha: jest.fn().mockResolvedValue({ success: true, score: 1.0, action: 'login' }),
  verifyRecaptchaV2: jest.fn().mockResolvedValue({ success: true }),
  RecaptchaChallengeRequired: class RecaptchaChallengeRequired extends Error {
    status = 449;
    challengeSiteKey: string;
    constructor(key: string) {
      super('Verificação adicional necessária');
      this.challengeSiteKey = key;
    }
  },
}));

jest.mock('../../../src/config/metrics', () => ({
  recordLogin: jest.fn(),
}));

jest.mock('../../../src/middlewares/rateLimiter', () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  passwordResetLimiter: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../../src/middlewares/securityMiddleware', () => ({
  noCacheAuth: (_req: any, _res: any, next: any) => next(),
  securityHeaders: (_req: any, _res: any, next: any) => next(),
  helmetConfig: (_req: any, _res: any, next: any) => next(),
  abortDetection: (_req: any, _res: any, next: any) => next(),
}));

import authService from '../../../src/services/auth.service';
import authRoutes from '../../../src/routes/auth.routes';
import { errorHandler } from '../../../src/middlewares/errorHandler';

const mockedAuthService = authService as jest.Mocked<typeof authService>;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

describe('Auth Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  // ─── POST /auth/signup (removido) ─────────────────────────────

  describe('POST /auth/signup', () => {
    it('deve retornar 404 — rota removida (cadastro via admin)', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ name: 'Test', email: 'test@gmail.com', password: 'Password123' });

      expect(res.status).toBe(404);
    });
  });

  // ─── POST /auth/signin ────────────────────────────────────────

  describe('POST /auth/signin', () => {
    const validBody = {
      email: 'test@gmail.com',
      password: 'Password123',
    };

    it('deve retornar 200 com credenciais válidas', async () => {
      mockedAuthService.signin.mockResolvedValue({
        auth: { user: { id: 1 } as any, accessToken: 'tok' },
        refreshToken: 'refresh-tok',
        refreshExpiresAt: new Date(Date.now() + 86400000),
      });

      const res = await request(app).post('/auth/signin').send(validBody);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockedAuthService.signin).toHaveBeenCalled();
    });

    it('deve retornar 422 com email inválido', async () => {
      const res = await request(app)
        .post('/auth/signin')
        .send({ ...validBody, email: 'invalid' });

      expect(res.status).toBe(422);
    });

    it('deve retornar 422 sem senha', async () => {
      const res = await request(app)
        .post('/auth/signin')
        .send({ email: 'test@gmail.com' });

      expect(res.status).toBe(422);
    });
  });

  // ─── POST /auth/refresh ───────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('deve retornar 401 sem cookie de refreshToken', async () => {
      const res = await request(app).post('/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── POST /auth/logout ────────────────────────────────────────

  describe('POST /auth/logout', () => {
    it('deve retornar 200 mesmo sem cookie', async () => {
      const res = await request(app).post('/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('Logout');
    });
  });

  // ─── POST /auth/forgot-password ───────────────────────────────

  describe('POST /auth/forgot-password', () => {
    it('deve retornar 200 com email válido', async () => {
      mockedAuthService.forgotPassword.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'test@gmail.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('deve retornar 422 com email inválido', async () => {
      const res = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'invalid' });

      expect(res.status).toBe(422);
    });
  });

  // ─── POST /auth/reset-password ────────────────────────────────

  describe('POST /auth/reset-password', () => {
    const validBody = {
      email: 'test@gmail.com',
      code: '123456',
      newPassword: 'NewPassword1',
    };

    it('deve retornar 200 com dados válidos', async () => {
      mockedAuthService.resetPassword.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/auth/reset-password')
        .send(validBody);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('deve retornar 422 com código curto', async () => {
      const res = await request(app)
        .post('/auth/reset-password')
        .send({ ...validBody, code: '123' });

      expect(res.status).toBe(422);
    });

    it('deve retornar 422 com senha fraca', async () => {
      const res = await request(app)
        .post('/auth/reset-password')
        .send({ ...validBody, newPassword: 'weak' });

      expect(res.status).toBe(422);
    });
  });
});
