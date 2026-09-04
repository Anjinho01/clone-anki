import { Router } from 'express';
import { body } from 'express-validator';
import syncController from '../controllers/sync.controller';
import { validationMiddleware } from '../middlewares/validationMiddleware';
import { verifyToken } from '../middlewares/authMiddleware';
import { syncLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.use(verifyToken);
router.use(syncLimiter);

router.post(
  '/',
  [
    body('lastSyncAt')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('lastSyncAt deve ser uma data ISO 8601 válida'),
    body('changes')
      .isArray()
      .withMessage('changes deve ser um array'),
    body('changes.*.entity')
      .isIn(['deck', 'card', 'reviewLog'])
      .withMessage('entity deve ser deck, card ou reviewLog'),
    body('changes.*.action')
      .isIn(['create', 'update', 'delete'])
      .withMessage('action deve ser create, update ou delete'),
    body('changes.*.updatedAt')
      .isISO8601()
      .withMessage('updatedAt deve ser uma data ISO 8601 válida'),
    body('changes.*.data')
      .isObject()
      .withMessage('data deve ser um objeto'),
  ],
  validationMiddleware,
  syncController.sync
);

export default router;
