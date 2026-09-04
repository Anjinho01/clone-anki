import { Router } from 'express';
import { body, param } from 'express-validator';
import deckController from '../controllers/deck.controller';
import { validationMiddleware } from '../middlewares/validationMiddleware';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// Todas as rotas de deck são protegidas
router.use(verifyToken);

// ─── Leitura (qualquer role autenticado) ─────────────────────
router.get('/', deckController.getAll);

router.get(
  '/:key([0-9a-fA-F-]+)',
  [param('key').isLength({ min: 1, max: 36 })],
  validationMiddleware,
  deckController.getById
);

// ─── CRUD de Deck (service decide permissões de private/general) ─────────────
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Nome do deck é obrigatório').isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('type').optional().isIn(['general', 'private']).withMessage('type deve ser general ou private'),
    body('packageId').optional({ nullable: true }).isInt({ min: 1 }),
    body('newCardsPerDay').optional().isInt({ min: 0, max: 9999 }),
    body('reviewCardsPerDay').optional().isInt({ min: 0, max: 9999 }),
    body('desiredRetention').optional().isFloat({ min: 0.5, max: 0.99 }),
  ],
  validationMiddleware,
  deckController.create
);

router.put(
  '/:id([0-9]+)',
  [
    param('id').isInt({ min: 1 }),
    body('name').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('packageId').optional({ nullable: true }).isInt({ min: 1 }),
    body('newCardsPerDay').optional().isInt({ min: 0, max: 9999 }),
    body('reviewCardsPerDay').optional().isInt({ min: 0, max: 9999 }),
    body('desiredRetention').optional().isFloat({ min: 0.5, max: 0.99 }),
  ],
  validationMiddleware,
  deckController.update
);

router.delete(
  '/:id([0-9]+)',
  [param('id').isInt({ min: 1 })],
  validationMiddleware,
  deckController.delete
);

export default router;
