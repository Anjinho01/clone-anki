import { Router } from 'express';
import { roleController } from '../controllers/role.controller';
import { verifyToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(verifyToken);

router.get('/', requireRole('admin'), roleController.getRoles);
router.get('/:id(\\d+)', requireRole('admin'), roleController.getRoleById);

export default router;
