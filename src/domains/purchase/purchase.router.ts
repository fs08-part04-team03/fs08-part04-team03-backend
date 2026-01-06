import { Router } from 'express';
import { checkBudget } from '../../common/middlewares/purchase.middleware';
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
  checkBudget,
  purchaseController.purchaseNow
);

// 💰 [Purchase] 내 구매 내역 조회 API
router.get(
  '/user/getMyPurchases',
  verifyAccessToken,
  requireMinRole('USER'),
  purchaseValidator.validateGetMyPurchase,
  validateRequest,
  purchaseController.getMyPurchases
);

// 💰 [Purchase] 내 구매 상세 조회 API
router.get(
  '/user/getMyPurchaseDetail/:id',
  verifyAccessToken,
  requireMinRole('USER'),
  purchaseValidator.validateGetMyPurchaseDetail,
  validateRequest,
  purchaseController.getMyPurchaseDetail
);

// 💰 [Purchase] 구매 요청 관리/조회 API (관리자)
router.get(
  '/admin/managePurchaseRequests',
  verifyAccessToken,
  requireMinRole('MANAGER'),
  purchaseValidator.validateManagePurchaseRequests,
  validateRequest,
  purchaseController.managePurchaseRequests
);

// 💰 [Purchase] 구매 요청 승인 API (관리자)
router.patch(
  '/admin/approvePurchaseRequest/:id',
  verifyAccessToken,
  requireMinRole('MANAGER'),
  purchaseValidator.validateApprovePurchaseRequest,
  validateRequest,
  purchaseController.approvePurchaseRequest
);

// 💰 [Purchase] 구매 요청 반려 API (관리자)
router.patch(
  '/admin/rejectPurchaseRequest/:id',
  verifyAccessToken,
  requireMinRole('MANAGER'),
  purchaseValidator.validateRejectPurchaseRequest,
  validateRequest,
  purchaseController.rejectPurchaseRequest
);

// 💰 [Purchase] 구매 요청 API
router.post(
  '/user/requestPurchase',
  verifyAccessToken,
  requireMinRole('USER'),
  purchaseValidator.validateRequestPurchase,
  validateRequest,
  checkBudget,
  purchaseController.requestPurchase
);

// 💰 [Purchase] 긴급 구매 요청 API
router.post(
  '/user/urgentRequestPurchase',
  verifyAccessToken,
  requireMinRole('USER'),
  purchaseValidator.validateRequestPurchase,
  validateRequest,
  purchaseController.requestPurchase
);

// 💰 [Purchase] 구매 요청 취소 API
router.patch(
  '/user/cancelPurchaseRequest/:id',
  verifyAccessToken,
  requireMinRole('USER'),
  purchaseValidator.validateCancelPurchaseRequest,
  validateRequest,
  purchaseController.cancelPurchaseRequest
);

// 💰 [Purchase] 지출 통계 조회 API
router.get(
  '/admin/expenseStatistics',
  verifyAccessToken,
  requireMinRole('MANAGER'),
  purchaseController.getExpenseStatistics
);

// 💰 [Purchase] 구매 관리 대시보드 API
router.get(
  '/admin/purchaseDashboard',
  verifyAccessToken,
  requireMinRole('MANAGER'),
  purchaseController.getPurchaseDashboard
);

export const purchaseRouter = router;
