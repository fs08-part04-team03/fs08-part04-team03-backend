import { Router } from 'express';
import { csrf } from 'lusca';
import type { Request as ExpressRequest } from 'express';
import { env } from '../../config/env.config';
import { authController } from './auth.controller';
import { invitationRouter } from './invitation.router';
import { authValidator } from './auth.validator';

const router = Router();

// CSRF 보호 미들웨어 설정
const csrfProtection = csrf({
  header: 'X-CSRF-Token', // xCsrfToken
  cookie: {
    name: 'XSRF-TOKEN', // xsrfToken
    options: {
      sameSite: env.COOKIE_SAME_SITE,
      secure: env.COOKIE_SECURE,
    },
  },
});

// CSRF 토큰 발급용
router.get('/csrf', csrfProtection, (req, res) => {
  const csrfToken = (req as ExpressRequest & { csrfToken: () => string }).csrfToken();
  res.status(200).json({ csrfToken });
});

router.post('/register', authValidator.signup, authController.signup);
router.post('/admin/register', authValidator.adminRegister, authController.adminRegister);
router.post('/login', authController.login); // TODO: 로그인 validator 추가 (임시 비밀번호가 해당 조건을 만족하지 않음)
router.post('/refresh', csrfProtection, authController.refresh);
router.post('/logout', csrfProtection, authController.logout);
router.use('/invitation', invitationRouter);

export const authRouter = router;
