import { Router } from 'express';
import { requireMinRole } from '../../common/middlewares/role.middleware';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { validateRequest } from '../../common/middlewares/validator.middleware';
import { purchaseValidator } from './purchase.validator';
import { purchaseController } from './purchase.controller';

const router = Router();

// 💰 [Purchase] 전체 구매 내역 목록 API (관리자)
router.get(
  '/admin/getAllPurchases',
  verifyAccessToken,
  requireMinRole('MANAGER'),
  purchaseValidator.validatePurchaseList,
  validateRequest,
  purchaseController.getAllPurchases
);

// 💰 [Purchase] 즉시 구매 API (관리자)
router.post(
  '/admin/purchaseNow',
  verifyAccessToken,
  requireMinRole('MANAGER'),
  purchaseValidator.validatePurchaseNow,
  validateRequest,
  purchaseController.purchaseNow
);

// 💰 [Purchase] 내 구매 내역 조회 API
router.get(
  '/my/getMyPurchases',
  verifyAccessToken,
  requireMinRole('USER'),
  purchaseValidator.validateGetMyPurchase,
  validateRequest,
  purchaseController.getMyPurchases
);

export const purchaseRouter = router;
