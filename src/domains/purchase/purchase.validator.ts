import { query, body } from 'express-validator';

// 💰 [Purchase] 전체 구매 내역 목록 API (관리자)
const validatePurchaseList = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'totalPrice']),
  query('order').optional().isIn(['asc', 'desc']),
];

// 💰 [Purchase] 즉시 구매 API (관리자)
const validatePurchaseNow = [
  body('shippingFee')
    .notEmpty()
    .withMessage('배송비는 필수입니다.')
    .bail()
    .isInt({ min: 0 })
    .withMessage('배송비는 0 이상의 정수여야 합니다.')
    .toInt(10),
  body('items').isArray({ min: 1 }).withMessage('구매할 상품 항목이 있어야 합니다.').bail(),
  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('상품 ID는 1 이상의 정수여야 합니다.')
    .toInt(),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('수량은 1 이상의 정수여야 합니다.')
    .toInt(),
];

// 💰 [Purchase] 내 구매 내역 조회 API
const validateGetMyPurchase = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'totalPrice']),
  query('order').optional().isIn(['asc', 'desc']),
];

const validateManagePurchaseRequests = [
  query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

// 💰 [Purchase] 구매 요청 승인 API (관리자)
const validateApprovePurchaseRequest = [
  body('message').optional().isString().withMessage('메시지는 문자열이어야 합니다.'),
];

// 💰 [Purchase] 구매 요청 반려 API (관리자)
const validateRejectPurchaseRequest = [
  body('reason')
    .notEmpty()
    .withMessage('반려 사유는 필수입니다.')
    .bail()
    .isString()
    .withMessage('반려 사유는 문자열이어야 합니다.'),
];

export const purchaseValidator = {
  validatePurchaseList,
  validatePurchaseNow,
  validateGetMyPurchase,
  validateManagePurchaseRequests,
  validateApprovePurchaseRequest,
  validateRejectPurchaseRequest,
};
