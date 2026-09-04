import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth.controller';
import { validationMiddleware } from '../middlewares/validationMiddleware';
import { verifyToken } from '../middlewares/authMiddleware';
import { authLimiter, passwordResetLimiter } from '../middlewares/rateLimiter';
import { noCacheAuth } from '../middlewares/securityMiddleware';

const router = Router();

// Impedir cache de respostas de autenticação (padrão ade90)
router.use(noCacheAuth);

// -- Públicas (com rate limit de auth) ---

router.post(
  '/signin',
  authLimiter,
  [
    body('email').trim().isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
    body('rememberMe').optional().isBoolean(),
  ],
  validationMiddleware,
  authController.signin
);

router.post('/refresh', authLimiter, authController.refresh);

router.post('/logout', authController.logout);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  [body('email').trim().isEmail().normalizeEmail().withMessage('Email inválido')],
  validationMiddleware,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  passwordResetLimiter,
  [
    body('email').trim().isEmail().normalizeEmail().withMessage('Email inválido'),
    body('code').trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('Código inválido'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Senha deve ter pelo menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Senha deve conter maiúscula, minúscula e número'),
  ],
  validationMiddleware,
  authController.resetPassword
);

// -- Protegidas ---

router.get('/me', verifyToken, authController.me);

router.put(
  '/change-password',
  verifyToken,
  [
    body('currentPassword').notEmpty().withMessage('Senha atual é obrigatória'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Nova senha deve ter pelo menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Nova senha deve conter maiúscula, minúscula e número'),
  ],
  validationMiddleware,
  authController.changePassword
);

export default router;
