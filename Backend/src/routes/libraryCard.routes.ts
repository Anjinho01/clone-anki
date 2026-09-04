import { Router } from 'express';
import { body, param } from 'express-validator';
import libraryCardController from '../controllers/libraryCard.controller';
import { validationMiddleware } from '../middlewares/validationMiddleware';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(verifyToken);

router.get('/', libraryCardController.getAll);

router.get(
  '/:key([0-9a-fA-F-]+)',
  [param('key').isLength({ min: 1, max: 36 })],
  validationMiddleware,
  libraryCardController.getById
);

router.post(
  '/',
  [
    body('front').trim().notEmpty().withMessage('Frente do card é obrigatória').isLength({ max: 2000 }),
    body('back').trim().notEmpty().withMessage('Verso do card é obrigatório').isLength({ max: 2000 }),
    body('type').optional().isIn(['general', 'private']).withMessage('Tipo inválido'),
    body('ownerUserId').optional({ nullable: true }).isInt({ min: 1 }),
    body('cardType').optional().isIn(['basic', 'reverse', 'reversed', 'cloze', 'mcq']).withMessage('Tipo de card inválido'),
    body('mcqOptions').optional().isArray({ min: 2 }).withMessage('MCQ precisa de ao menos 2 opções'),
    body('mcqCorrect').optional().isInt({ min: 0 }),
  ],
  validationMiddleware,
  libraryCardController.create
);

router.put(
  '/:id([0-9]+)',
  [
    param('id').isInt({ min: 1 }),
    body('front').optional().trim().notEmpty().isLength({ max: 2000 }),
    body('back').optional().trim().notEmpty().isLength({ max: 2000 }),
    body('type').optional().isIn(['general', 'private']),
    body('ownerUserId').optional({ nullable: true }).isInt({ min: 1 }),
    body('cardType').optional().isIn(['basic', 'reverse', 'reversed', 'cloze', 'mcq']),
    body('mcqOptions').optional().isArray({ min: 2 }),
    body('mcqCorrect').optional().isInt({ min: 0 }),
  ],
  validationMiddleware,
  libraryCardController.update
);

router.delete(
  '/:id([0-9]+)',
  [param('id').isInt({ min: 1 })],
  validationMiddleware,
  libraryCardController.delete
);

router.post(
  '/:id([0-9]+)/decks/:deckId([0-9]+)',
  [param('id').isInt({ min: 1 }), param('deckId').isInt({ min: 1 })],
  validationMiddleware,
  libraryCardController.addToDeck
);

router.delete(
  '/:id([0-9]+)/decks/:deckId([0-9]+)',
  [param('id').isInt({ min: 1 }), param('deckId').isInt({ min: 1 })],
  validationMiddleware,
  libraryCardController.removeFromDeck
);

export default router;