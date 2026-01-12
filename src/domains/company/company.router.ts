import { Router } from 'express';
import { role } from '@prisma/client';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { verifyTenantAccess } from '../../common/middlewares/tenant.middleware';
import { requireMinRole } from '../../common/middlewares/role.middleware';
import { companyController } from './company.controller';

const router = Router();

// 회사 상세 정보 조회
router.get(
  '/',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  companyController.getDetail
);

export const companyRouter = router;
