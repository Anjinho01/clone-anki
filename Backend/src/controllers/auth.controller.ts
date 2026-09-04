import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import env from '../config/env';
import { verifyRecaptcha, verifyRecaptchaV2, RecaptchaChallengeRequired } from '../utils/recaptcha';
import { recordLogin } from '../config/metrics';

/**
 * Cookie options — ajusta sameSite/secure conforme o cenário:
 *
 * - Same-origin (via nginx reverse proxy): sameSite='strict', secure=true
 * - Cross-site (domínios diferentes):      sameSite='none',   secure=true
 *
 * Controlado pela env CROSS_SITE_COOKIES=true/false.
 */
function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: (env.CROSS_SITE_COOKIES ? 'none' : 'strict') as 'none' | 'strict',
    path: '/auth',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

const authController = {
  /**
   * POST /auth/signin
   */
  async signin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recaptchaToken, recaptchaV2Token } = req.body;

      // reCAPTCHA — v2 tem prioridade (usuário já resolveu challenge)
      if (recaptchaV2Token) {
        await verifyRecaptchaV2(recaptchaV2Token);
      } else if (recaptchaToken) {
        await verifyRecaptcha(recaptchaToken, 'login');
      }

      const ip = req.ip || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const { auth, refreshToken, refreshExpiresAt } = await authService.signin(
        req.body,
        ip,
        userAgent
      );

      recordLogin(true);

      // Refresh token no cookie httpOnly
      res.cookie('refreshToken', refreshToken, {
        ...getRefreshCookieOptions(),
        maxAge: refreshExpiresAt.getTime() - Date.now(),
      });

      res.json({ success: true, data: auth });
    } catch (error) {
      if (error instanceof RecaptchaChallengeRequired) {
        res.status(449).json({
          requireChallenge: true,
          challengeSiteKey: error.challengeSiteKey,
          message: error.message,
        });
        return;
      }
      recordLogin(false);
      next(error);
    }
  },

  /**
   * POST /auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: { message: 'Refresh token não fornecido', statusCode: 401 },
        });
        return;
      }

      const { accessToken, newRefreshToken, expiresAt } =
        await authService.refresh(refreshToken);

      // Rotação: novo cookie
      res.cookie('refreshToken', newRefreshToken, {
        ...getRefreshCookieOptions(),
        maxAge: expiresAt.getTime() - Date.now(),
      });

      res.json({ success: true, data: { accessToken } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie('refreshToken', {
        path: '/auth',
        ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
      });
      res.json({ success: true, data: { message: 'Logout realizado com sucesso' } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recaptchaToken, recaptchaV2Token } = req.body;

      if (recaptchaV2Token) {
        await verifyRecaptchaV2(recaptchaV2Token);
      } else if (recaptchaToken) {
        await verifyRecaptcha(recaptchaToken, 'forgot_password');
      }

      await authService.forgotPassword(req.body);
      // Sempre retorna sucesso (não revelar se email existe)
      res.json({
        success: true,
        data: { message: 'Se o email existir, um código de recuperação foi enviado' },
      });
    } catch (error) {
      if (error instanceof RecaptchaChallengeRequired) {
        res.status(449).json({
          requireChallenge: true,
          challengeSiteKey: error.challengeSiteKey,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  },

  /**
   * POST /auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resetPassword(req.body);
      res.json({ success: true, data: { message: 'Senha redefinida com sucesso' } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/me
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getProfile(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /auth/change-password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.changePassword(req.user!.userId, req.body);
      res.clearCookie('refreshToken', {
        path: '/auth',
        ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
      });
      res.json({
        success: true,
        data: { message: 'Senha alterada. Faça login novamente.' },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default authController;
