import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(verifyToken);

router.get('/', notificationController.listMine);
router.get('/unread-count', notificationController.unreadCount);
router.post('/:id/read', notificationController.markRead);
router.post('/read-all', notificationController.markAll);

export default router;
