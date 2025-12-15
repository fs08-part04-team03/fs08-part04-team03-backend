import { Router } from 'express';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { requireMinRole } from '../../common/middlewares/role.middleware';
import { companyController } from './company.controller';
import { companyValidator } from './company.validator';

const router = Router();

// 회사 상세 정보 조회
router.get('/', verifyAccessToken, requireMinRole('USER'), companyController.getDetail);
// 회사 소속 유저 조회 (Admin 전용)
router.get(
  '/users',
  verifyAccessToken,
  requireMinRole('ADMIN'),
  companyValidator.getUsers,
  companyController.getUsers
);
// 회사명 변경 (Admin 전용)
router.patch(
  '/name',
  verifyAccessToken,
  requireMinRole('ADMIN'),
  companyValidator.updateName,
  companyController.updateName
);

export const companyRouter = router;
