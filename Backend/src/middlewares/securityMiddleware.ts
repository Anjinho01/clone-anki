import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

/**
 * Helmet v8 com CSP personalizado — padrão api-app-ade90
 */
export const helmetConfig = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // necessário para Swagger UI
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
});

/**
 * Headers de segurança adicionais — complemento ao Helmet
 * Padrão api-app-ade90
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
}

/**
 * No-cache em rotas de autenticação — impede cache de respostas sensíveis
 * Padrão api-app-ade90
 */
export function noCacheAuth(_req: Request, res: Response, next: NextFunction): void {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  next();
}

/**
 * Detecção de abort — permite short-circuit em operações demoradas
 * Padrão api-app-ade90
 */
export function abortDetection(req: Request, _res: Response, next: NextFunction): void {
  let aborted = false;

  req.on('aborted', () => {
    aborted = true;
  });
  req.on('close', () => {
    if (!req.complete) aborted = true;
  });

  (req as Request & { isAborted: () => boolean }).isAborted = () => aborted;
  next();
}
