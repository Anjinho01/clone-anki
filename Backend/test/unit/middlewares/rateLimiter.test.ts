/**
 * Rate Limiter Middleware Tests
 */

import {
  globalLimiter,
  authLimiter,
  passwordResetLimiter,
  syncLimiter,
} from '../../../src/middlewares/rateLimiter';

describe('Rate Limiter Middleware', () => {
  describe('globalLimiter', () => {
    it('deve estar definido', () => {
      expect(globalLimiter).toBeDefined();
    });

    it('deve ser uma função (middleware Express)', () => {
      expect(typeof globalLimiter).toBe('function');
    });
  });

  describe('authLimiter', () => {
    it('deve estar definido', () => {
      expect(authLimiter).toBeDefined();
    });

    it('deve ser uma função', () => {
      expect(typeof authLimiter).toBe('function');
    });
  });

  describe('passwordResetLimiter', () => {
    it('deve estar definido', () => {
      expect(passwordResetLimiter).toBeDefined();
    });

    it('deve ser uma função', () => {
      expect(typeof passwordResetLimiter).toBe('function');
    });
  });

  describe('syncLimiter', () => {
    it('deve estar definido', () => {
      expect(syncLimiter).toBeDefined();
    });

    it('deve ser uma função', () => {
      expect(typeof syncLimiter).toBe('function');
    });
  });
});
