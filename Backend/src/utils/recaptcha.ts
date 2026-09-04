/**
 * reCAPTCHA v3 + v2 fallback
 *
 * Fluxo:
 *   1. Frontend envia token v3 (invisível) → verifyRecaptcha()
 *   2. Se score < threshold → lança RecaptchaChallengeRequired (HTTP 449)
 *   3. Frontend mostra checkbox v2 → usuário resolve → envia token v2
 *   4. verifyRecaptchaV2() valida o token v2
 *
 * Degradação graciosa: se a API do Google não responder,
 * o login prossegue normalmente (não bloqueia usuários legítimos).
 */
import axios from 'axios';
import env from '../config/env';
import logger from '../config/logger';
import { HttpError } from '../errors/httpError';

const GOOGLE_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

// ─── Custom error para pedir challenge v2 ──────────────────────

export class RecaptchaChallengeRequired extends Error {
  public status: number;
  public challengeSiteKey: string;

  constructor(challengeSiteKey: string) {
    super('Verificação adicional necessária');
    this.name = 'RecaptchaChallengeRequired';
    this.status = 449;
    this.challengeSiteKey = challengeSiteKey;
  }
}

// ─── Verificação reCAPTCHA v3 ──────────────────────────────────

export async function verifyRecaptcha(
  token: string,
  expectedAction = 'login'
): Promise<{ success: boolean; score: number; action: string }> {
  // Bypass em dev/test
  if (env.isDev() || env.isTest()) {
    return { success: true, score: 1.0, action: expectedAction };
  }

  if (!env.RECAPTCHA_V3_SECRET_KEY) {
    logger.warn('RECAPTCHA_V3_SECRET_KEY não configurada — bypass de verificação');
    return { success: true, score: 1.0, action: expectedAction };
  }

  try {
    const params = new URLSearchParams({
      secret: env.RECAPTCHA_V3_SECRET_KEY,
      response: token,
    });

    const { data } = await axios.post(GOOGLE_VERIFY_URL, params, { timeout: 5000 });

    if (!data.success) {
      logger.warn('reCAPTCHA v3 falhou', { errorCodes: data['error-codes'] });
      throw new HttpError(403, 'Falha na verificação reCAPTCHA');
    }

    if (data.action !== expectedAction) {
      logger.warn('reCAPTCHA v3 ação inválida', {
        expected: expectedAction,
        received: data.action,
      });
      throw new HttpError(403, 'Ação reCAPTCHA inválida');
    }

    // Score baixo → trigger v2 checkbox fallback
    if (data.score < env.RECAPTCHA_MIN_SCORE) {
      logger.info('reCAPTCHA v3 score baixo, solicitando v2', { score: data.score });

      if (env.RECAPTCHA_V2_SITE_KEY) {
        throw new RecaptchaChallengeRequired(env.RECAPTCHA_V2_SITE_KEY);
      }

      throw new HttpError(403, 'Verificação de segurança falhou');
    }

    return data;
  } catch (error) {
    // Re-throw erros conhecidos
    if (error instanceof RecaptchaChallengeRequired || error instanceof HttpError) {
      throw error;
    }

    // Degradação graciosa: API do Google inacessível → não bloqueia login
    logger.error('reCAPTCHA v3 API inacessível — prosseguindo sem verificação', {
      message: (error as Error).message,
    });
    return { success: true, score: 1.0, action: expectedAction };
  }
}

// ─── Verificação reCAPTCHA v2 (checkbox fallback) ──────────────

export async function verifyRecaptchaV2(
  token: string
): Promise<{ success: boolean }> {
  // Bypass em dev/test
  if (env.isDev() || env.isTest()) {
    return { success: true };
  }

  if (!env.RECAPTCHA_V2_SECRET_KEY) {
    logger.warn('RECAPTCHA_V2_SECRET_KEY não configurada — bypass de verificação');
    return { success: true };
  }

  try {
    const params = new URLSearchParams({
      secret: env.RECAPTCHA_V2_SECRET_KEY,
      response: token,
    });

    const { data } = await axios.post(GOOGLE_VERIFY_URL, params, { timeout: 5000 });

    if (!data.success) {
      logger.warn('reCAPTCHA v2 falhou', { errorCodes: data['error-codes'] });
      throw new HttpError(403, 'Verificação reCAPTCHA falhou');
    }

    return data;
  } catch (error) {
    if (error instanceof HttpError) throw error;

    // Degradação graciosa
    logger.error('reCAPTCHA v2 API inacessível — prosseguindo sem verificação', {
      message: (error as Error).message,
    });
    return { success: true };
  }
}
