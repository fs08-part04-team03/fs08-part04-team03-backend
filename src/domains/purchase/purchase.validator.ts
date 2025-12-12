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

export const purchaseValidator = {
  validatePurchaseList,
  validatePurchaseNow,
};
