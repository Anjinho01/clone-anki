import { Router } from 'express';
import { body, param, query } from 'express-validator';
import userController from '../controllers/user.controller';
import { validationMiddleware } from '../middlewares/validationMiddleware';
import { verifyToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Todas as rotas de usuário são protegidas
router.use(verifyToken);

// ─── Perfil do próprio usuário (qualquer role autenticado) ───
router.get('/profile', userController.profile);
router.get('/me',      userController.me);

router.put(
  '/me',
  [
    body('name').optional().trim().notEmpty().isLength({ min: 2, max: 100 }),
    body('email').optional().trim().isEmail().normalizeEmail().withMessage('Email inválido'),
  ],
  validationMiddleware,
  userController.updateMe
);

router.put(
  '/me/reset-password',
  [
    body('currentPassword').notEmpty().withMessage('Senha atual é obrigatória'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Nova senha deve ter pelo menos 8 caracteres'),
  ],
  validationMiddleware,
  userController.resetPasswordMe
);

// ─── Admin CRUD (develop + admin) ───────────────────────────

router.get(
  '/',
  requireRole('admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['all', 'actived', 'deactivated']),
    query('roles').optional().trim(),
    query('search').optional().trim().isLength({ max: 100 }),
  ],
  validationMiddleware,
  userController.list
);

router.get(
  '/:id([0-9]+)',
  requireRole('admin'),
  [param('id').isInt({ min: 1 })],
  validationMiddleware,
  userController.getById
);

router.post(
  '/',
  requireRole('admin'),
  [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório').isLength({ min: 2, max: 100 }),
    body('email').trim().isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Senha deve ter pelo menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Senha deve conter maiúscula, minúscula e número'),
    body('role').optional().isIn(['develop', 'admin', 'monitor', 'user']).withMessage('Role inválida'),
  ],
  validationMiddleware,
  userController.create
);

router.put(
  '/:id([0-9]+)',
  requireRole('admin'),
  [
    param('id').isInt({ min: 1 }),
    body('name').optional().trim().notEmpty().isLength({ min: 2, max: 100 }),
    body('email').optional().trim().isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Senha deve ter pelo menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Senha deve conter maiúscula, minúscula e número'),
    body('role').optional().isIn(['develop', 'admin', 'monitor', 'user']).withMessage('Role inválida'),
    body('isActive').optional().isBoolean(),
    body('actived').optional(),
  ],
  validationMiddleware,
  userController.update
);

router.put(
  '/:id([0-9]+)/reset-password',
  requireRole('admin'),
  [
    param('id').isInt({ min: 1 }),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Nova senha deve ter pelo menos 8 caracteres'),
  ],
  validationMiddleware,
  userController.resetPasswordById
);

router.patch(
  '/:id([0-9]+)/toggle-active',
  requireRole('admin'),
  [
    param('id').isInt({ min: 1 }),
    body('isActive').isBoolean().withMessage('isActive é obrigatório (true/false)'),
  ],
  validationMiddleware,
  userController.toggleActive
);

export default router;
