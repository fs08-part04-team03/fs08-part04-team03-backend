import { Router } from 'express';
import { authController } from './auth.controller';
import { invitationRouter } from './invitation.router';

const router = Router();

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.use('/invitation', invitationRouter);

export const authRouter = router;
