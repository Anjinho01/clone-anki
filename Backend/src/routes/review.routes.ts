import { Router } from 'express';
import { body, param, query } from 'express-validator';
import reviewController from '../controllers/review.controller';
import { validationMiddleware } from '../middlewares/validationMiddleware';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(verifyToken);

// Sessão de estudo — cards para revisar
router.get(
  '/study/:deckId([0-9]+)',
  [
    param('deckId').isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
  ],
  validationMiddleware,
  reviewController.getStudySession
);

// Preview — intervalos para cada rating (sem salvar nada)
router.get(
  '/preview/:cardId([0-9]+)',
  [param('cardId').isInt({ min: 1 })],
  validationMiddleware,
  reviewController.previewCard
);

// Submeter review (o coração do FSRS)
router.post(
  '/',
  [
    body('cardId').isInt({ min: 1 }).withMessage('cardId é obrigatório'),
    body('rating')
      .isInt({ min: 1, max: 4 })
      .withMessage('Rating deve ser 1 (Again), 2 (Hard), 3 (Good) ou 4 (Easy)'),
    body('durationMs').optional().isInt({ min: 0 }),
  ],
  validationMiddleware,
  reviewController.submitReview
);

// Desfazer último review de um card
router.post(
  '/undo',
  [body('cardId').isInt({ min: 1 }).withMessage('cardId é obrigatório')],
  validationMiddleware,
  reviewController.undoReview
);

// Estatísticas de estudo
router.get(
  '/stats',
  [query('days').optional().isInt({ min: 1, max: 365 })],
  validationMiddleware,
  reviewController.getStats
);

// Histórico de reviews de um card
router.get(
  '/history/:cardId([0-9]+)',
  [param('cardId').isInt({ min: 1 })],
  validationMiddleware,
  reviewController.getCardHistory
);

export default router;
