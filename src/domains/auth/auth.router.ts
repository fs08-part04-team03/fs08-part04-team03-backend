import { Router } from 'express';
import { authController } from './auth.controller';
import { invitationRouter } from './invitation.router';
import { authValidator } from './auth.validator';

const router = Router();

router.post('/register', authValidator.signup, authController.signup);
router.post('/admin/register', authValidator.adminRegister, authController.adminRegister);
router.post('/login', authController.login); // TODO: 로그인 validator 추가 (임시 비밀번호가 해당 조건을 만족하지 않음)
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.use('/invitation', invitationRouter);

export const authRouter = router;
