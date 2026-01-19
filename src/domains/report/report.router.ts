import { Router } from 'express';
import { role } from '@prisma/client';
import { requireRoles } from '../../common/middlewares/role.middleware';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { verifyTenantAccess } from '../../common/middlewares/tenant.middleware';
import { validateRequest } from '../../common/middlewares/validator.middleware';
import { reportController } from './report.controller';
import { validateExportPurchaseRequests } from './report.validator';

const router = Router();

// 엑셀 report 다운로드 (어드민 전용)
router.get(
  '/admin/exportPurchaseRequests',
  verifyAccessToken,
  verifyTenantAccess,
  requireRoles(role.ADMIN),
  validateExportPurchaseRequests,
  validateRequest,
  reportController.exportPurchaseRequests
);

export const reportRouter = router;
