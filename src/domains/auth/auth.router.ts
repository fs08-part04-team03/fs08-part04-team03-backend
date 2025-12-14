import { Router } from 'express';
import { requireMinRole } from '../../common/middlewares/role.middleware';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { authController } from './auth.controller';

const router = Router();

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', verifyAccessToken, requireMinRole('USER'), authController.me);
router.get('/manager', verifyAccessToken, requireMinRole('MANAGER'), authController.me);
router.get('/admin', verifyAccessToken, requireMinRole('ADMIN'), authController.me);

export const authRouter = router;
