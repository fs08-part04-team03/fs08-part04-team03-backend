import { Router } from 'express';
import { authController } from './auth.controller';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';

const router = Router();

router.post('/login', authController.login);
router.get('/me', verifyAccessToken, authController.me);

export const authRouter = router;
