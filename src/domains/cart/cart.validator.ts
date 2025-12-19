import { body, query } from 'express-validator';

// 🛒 [Cart] 장바구니에 상품 추가 API
const validateAddToCart = [
  body('productId')
    .notEmpty()
    .withMessage('상품 ID는 필수입니다.')
    .isInt({ min: 1 })
    .withMessage('상품 ID는 1 이상의 정수여야 합니다.')
    .toInt(),
  body('quantity')
    .notEmpty()
    .withMessage('수량은 필수입니다.')
    .isInt({ min: 1 })
    .withMessage('수량은 1 이상의 정수여야 합니다.')
    .toInt(),
];

// 🛒 [Cart] 내 장바구니 조회 API
const validateGetMyCart = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

// 🛒 [Cart] 장바구니 수량 수정 API
const validateUpdateQuantity = [
  body('cartItemId')
    .notEmpty()
    .withMessage('장바구니 항목 ID는 필수입니다.')
    .isString()
    .withMessage('장바구니 항목 ID는 문자열이어야 합니다.'),
  body('quantity')
    .notEmpty()
    .withMessage('수량은 필수입니다.')
    .isInt({ min: 1 })
    .withMessage('수량은 1 이상의 정수여야 합니다.')
    .toInt(),
];

// 🛒 [Cart] 장바구니 삭제 API
const validateDeleteFromCart = [
  body('cartItemId')
    .notEmpty()
    .withMessage('장바구니 항목 ID는 필수입니다.')
    .isString()
    .withMessage('장바구니 항목 ID는 문자열이어야 합니다.'),
];

// 🛒 [Cart] 장바구니 다중 삭제 API
const validateDeleteMultipleFromCart = [
  body('cartItemIds')
    .notEmpty()
    .withMessage('장바구니 항목 ID 배열은 필수입니다.')
    .isArray({ min: 1 })
    .withMessage('최소 1개 이상의 항목을 선택해주세요.')
    .custom((value: unknown[]) => {
      if (!value.every((id) => typeof id === 'string')) {
        throw new Error('모든 항목 ID는 문자열이어야 합니다.');
      }
      return true;
    }),
];

export const cartValidator = {
  validateAddToCart,
  validateGetMyCart,
  validateUpdateQuantity,
  validateDeleteFromCart,
  validateDeleteMultipleFromCart,
};
