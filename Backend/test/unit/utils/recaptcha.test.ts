/**
 * reCAPTCHA Utils Tests
 *
 * Como env.isTest() retorna true, verifyRecaptcha e verifyRecaptchaV2
 * fazem bypass automático (degradação graciosa).
 * Testamos o bypass + a classe RecaptchaChallengeRequired.
 */

import { verifyRecaptcha, verifyRecaptchaV2, RecaptchaChallengeRequired } from '../../../src/utils/recaptcha';

describe('reCAPTCHA Utils', () => {
  describe('RecaptchaChallengeRequired', () => {
    it('deve ter status 449', () => {
      const err = new RecaptchaChallengeRequired('site-key-123');

      expect(err.status).toBe(449);
      expect(err.challengeSiteKey).toBe('site-key-123');
      expect(err.name).toBe('RecaptchaChallengeRequired');
      expect(err.message).toBe('Verificação adicional necessária');
    });

    it('deve ser instância de Error', () => {
      const err = new RecaptchaChallengeRequired('key');

      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('verifyRecaptcha (bypass em test)', () => {
    it('deve retornar success: true em ambiente de teste', async () => {
      const result = await verifyRecaptcha('any-token', 'login');

      expect(result.success).toBe(true);
      expect(result.score).toBe(1.0);
      expect(result.action).toBe('login');
    });

    it('deve usar action padrão "login"', async () => {
      const result = await verifyRecaptcha('any-token');

      expect(result.action).toBe('login');
    });

    it('deve aceitar action customizada', async () => {
      const result = await verifyRecaptcha('any-token', 'signup');

      expect(result.action).toBe('signup');
    });
  });

  describe('verifyRecaptchaV2 (bypass em test)', () => {
    it('deve retornar success: true em ambiente de teste', async () => {
      const result = await verifyRecaptchaV2('any-token');

      expect(result.success).toBe(true);
    });
  });
});
