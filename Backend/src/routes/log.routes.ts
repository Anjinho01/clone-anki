import { Router } from 'express';
import { query } from 'express-validator';
import logController from '../controllers/log.controller';
import { validationMiddleware } from '../middlewares/validationMiddleware';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// Todas as rotas de logs são protegidas — RBAC no service
router.use(verifyToken);

// ─── Activity Logs (CRUD history) ────────────────────────────

router.get(
  '/activity',
  [
    query('tableName').optional().trim().isLength({ max: 100 }),
    query('recordId').optional().isInt({ min: 1 }),
    query('userId').optional().isInt({ min: 1 }),
    query('action').optional().isIn(['CREATE', 'UPDATE', 'DELETE']),
    query('startDate').optional().isISO8601().withMessage('startDate deve ser ISO-8601'),
    query('endDate').optional().isISO8601().withMessage('endDate deve ser ISO-8601'),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validationMiddleware,
  logController.listActivity
);

// ─── Access Logs (login history) ─────────────────────────────

router.get(
  '/access',
  [
    query('userId').optional().isInt({ min: 1 }),
    query('email').optional().trim().isLength({ max: 255 }),
    query('success').optional().isIn(['true', 'false']),
    query('startDate').optional().isISO8601().withMessage('startDate deve ser ISO-8601'),
    query('endDate').optional().isISO8601().withMessage('endDate deve ser ISO-8601'),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validationMiddleware,
  logController.listAccess
);

export default router;
