import { Router } from 'express';
import { requireMinRole } from '@/common/middlewares/role.middleware';
import { verifyAccessToken } from '@/common/middlewares/auth.middleware';
import { validateRequest } from '@/common/middlewares/validator.middleware';
import { purchaseValidator } from '@/domains/purchase/purchase.validator';
import { purchaseController } from './purchase.controller';

const router = Router();

// 💰 [Purchase] 전체 구매 내역 목록 API (관리자)
router.get(
  '/admin/getAllPurchases',
  verifyAccessToken,
  requireMinRole('MANAGER'),
  validateRequest,
  purchaseValidator.validatePurchaseList,
  purchaseController.getAllPurchases
);

export const purchaseRouter = router;
