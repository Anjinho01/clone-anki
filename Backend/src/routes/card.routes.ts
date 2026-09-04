import { Router } from 'express';
import { param } from 'express-validator';
import cardController from '../controllers/card.controller';
import { validationMiddleware } from '../middlewares/validationMiddleware';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(verifyToken);

// Listar cards do usuário em um deck
router.get(
  '/deck/:deckId([0-9]+)',
  [param('deckId').isInt({ min: 1 })],
  validationMiddleware,
  cardController.getByDeck
);

// Buscar card por ID de progresso do usuario
router.get(
  '/:id([0-9]+)',
  [param('id').isInt({ min: 1 })],
  validationMiddleware,
  cardController.getById
);

// Suspender / Reativar / Enterrar
router.patch(
  '/:id([0-9]+)/suspend',
  [param('id').isInt({ min: 1 })],
  validationMiddleware,
  cardController.suspend
);

router.patch(
  '/:id([0-9]+)/unsuspend',
  [param('id').isInt({ min: 1 })],
  validationMiddleware,
  cardController.unsuspend
);

router.patch(
  '/:id([0-9]+)/bury',
  [param('id').isInt({ min: 1 })],
  validationMiddleware,
  cardController.bury
);

// Auto-unbury de cards enterrados em dias passados
router.post(
  '/deck/:deckId([0-9]+)/unbury-expired',
  [param('deckId').isInt({ min: 1 })],
  validationMiddleware,
  cardController.unburyExpired
);

export default router;
