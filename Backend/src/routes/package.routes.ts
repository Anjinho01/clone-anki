import { Router } from 'express';
import { body, param } from 'express-validator';
import packageController from '../controllers/package.controller';
import { validationMiddleware } from '../middlewares/validationMiddleware';
import { verifyToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(verifyToken);

// ─── Leitura (qualquer autenticado) ──────────────────────────────────────────
router.get('/', packageController.getAll);

router.get(
  '/:key([0-9a-fA-F-]+)',
  [param('key').isLength({ min: 1, max: 36 })],
  validationMiddleware,
  packageController.getById
);

// ─── Criação / Edição / Exclusão com permissão por role/autoria ───────────────
router.post(
  '/',
  requireRole(['develop', 'admin', 'monitor']),
  [
    body('name').trim().notEmpty().withMessage('Nome do package é obrigatório').isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('position').optional().isInt({ min: 0, max: 999999 }),
  ],
  validationMiddleware,
  packageController.create
);

router.put(
  '/:id([0-9]+)',
  requireRole(['develop', 'admin', 'monitor']),
  [
    param('id').isInt({ min: 1 }),
    body('name').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('position').optional().isInt({ min: 0, max: 999999 }),
  ],
  validationMiddleware,
  packageController.update
);

router.delete(
  '/:id([0-9]+)',
  requireRole(['develop', 'admin', 'monitor']),
  [param('id').isInt({ min: 1 })],
  validationMiddleware,
  packageController.delete
);

export default router;
