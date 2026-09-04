/**
 * Environment Configuration Tests
 */

import env, { validateEnv } from '../../../src/config/env';

describe('Environment Configuration', () => {
  describe('env object', () => {
    it('deve ter todas as propriedades obrigatórias', () => {
      expect(env).toHaveProperty('NODE_ENV');
      expect(env).toHaveProperty('PORT');
      expect(env).toHaveProperty('HOST');
      expect(env).toHaveProperty('DB_HOST');
      expect(env).toHaveProperty('DB_PORT');
      expect(env).toHaveProperty('DB_USER');
      expect(env).toHaveProperty('DB_NAME');
      expect(env).toHaveProperty('JWT_SECRET');
      expect(env).toHaveProperty('JWT_REFRESH_SECRET');
      expect(env).toHaveProperty('JWT_EXPIRES_IN');
      expect(env).toHaveProperty('FRONTEND_ORIGINS');
      expect(env).toHaveProperty('RECAPTCHA_MIN_SCORE');
    });

    it('deve ter tipos corretos', () => {
      expect(typeof env.NODE_ENV).toBe('string');
      expect(typeof env.PORT).toBe('number');
      expect(typeof env.HOST).toBe('string');
      expect(typeof env.DB_PORT).toBe('number');
      expect(typeof env.DB_CONNECTION_LIMIT).toBe('number');
      expect(typeof env.DB_CONNECT_TIMEOUT).toBe('number');
      expect(typeof env.RECAPTCHA_MIN_SCORE).toBe('number');
      expect(typeof env.CROSS_SITE_COOKIES).toBe('boolean');
    });

    it('deve parsear números corretamente', () => {
      expect(env.PORT).toBeGreaterThan(0);
      expect(env.PORT).toBeLessThan(65536);
      expect(env.DB_PORT).toBeGreaterThan(0);
      expect(env.DB_CONNECTION_LIMIT).toBeGreaterThan(0);
      expect(env.DB_CONNECT_TIMEOUT).toBeGreaterThan(0);
    });

    it('deve ter NODE_ENV válido', () => {
      expect(['development', 'production', 'test']).toContain(env.NODE_ENV);
    });

    it('deve ter FRONTEND_ORIGINS como array', () => {
      expect(Array.isArray(env.FRONTEND_ORIGINS)).toBe(true);
      expect(env.FRONTEND_ORIGINS.length).toBeGreaterThan(0);
    });

    it('deve incluir localhost:5173 nas origens por padrão', () => {
      expect(env.FRONTEND_ORIGINS).toContain('http://localhost:5173');
    });

    it('deve ter RECAPTCHA_MIN_SCORE entre 0 e 1', () => {
      expect(env.RECAPTCHA_MIN_SCORE).toBeGreaterThanOrEqual(0);
      expect(env.RECAPTCHA_MIN_SCORE).toBeLessThanOrEqual(1);
    });
  });

  describe('helpers de ambiente', () => {
    it('isDev() deve retornar false em test', () => {
      expect(env.isDev()).toBe(false);
    });

    it('isTest() deve retornar true em test', () => {
      expect(env.isTest()).toBe(true);
    });

    it('isProd() deve retornar false em test', () => {
      expect(env.isProd()).toBe(false);
    });
  });

  describe('validateEnv', () => {
    it('não deve lançar erro em ambiente de teste', () => {
      expect(() => validateEnv()).not.toThrow();
    });
  });
});
