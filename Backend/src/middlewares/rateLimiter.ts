import { Request } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Extrai IP real do client (por trás de proxy/nginx)
 * Padrão api-app-ade90
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return first.trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Rate limiters em 4 tiers — padrão Ade90
 */

// Global: 1500 req / 15 min (generoso para produção)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: getClientIp,
  skip: (req) => {
    return req.method === 'OPTIONS' || req.path === '/healthz' || req.path === '/health';
  },
  message: {
    success: false,
    error: {
      message: 'Muitas requisições deste IP, tente novamente mais tarde.',
      statusCode: 429,
    },
  },
});

// Auth: 30 req / 15 min (brute force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: {
    success: false,
    error: {
      message: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
      statusCode: 429,
    },
  },
});

// Password reset: 5 req / 1 hora
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: {
    success: false,
    error: {
      message: 'Muitas tentativas de redefinição de senha. Tente novamente em 1 hora.',
      statusCode: 429,
    },
  },
});

// Sync: 60 req / 15 min (sync pode ser frequente)
export const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: {
    success: false,
    error: {
      message: 'Muitas requisições de sync. Tente novamente em 15 minutos.',
      statusCode: 429,
    },
  },
});
