import { Router } from 'express';
import { requireMinRole } from '../../common/middlewares/role.middleware';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { validateRequest } from '../../common/middlewares/validator.middleware';
import { cartValidator } from './cart.validator';
import { cartController } from './cart.controller';

const router = Router();

// 🛒 [Cart] 장바구니에 상품 추가 API
router.post(
  '/addToCart',
  verifyAccessToken,
  requireMinRole('USER'),
  cartValidator.validateAddToCart,
  validateRequest,
  cartController.addToCart
);

// 🛒 [Cart] 내 장바구니 조회 API
router.get(
  '/getMyCart',
  verifyAccessToken,
  requireMinRole('USER'),
  cartValidator.validateGetMyCart,
  validateRequest,
  cartController.getMyCart
);

// 🛒 [Cart] 장바구니 수량 수정 API
router.patch(
  '/updateQuantity',
  verifyAccessToken,
  requireMinRole('USER'),
  cartValidator.validateUpdateQuantity,
  validateRequest,
  cartController.updateQuantity
);

// 🛒 [Cart] 장바구니 삭제 API
router.delete(
  '/deleteFromCart',
  verifyAccessToken,
  requireMinRole('USER'),
  cartValidator.validateDeleteFromCart,
  validateRequest,
  cartController.deleteFromCart
);

// 🛒 [Cart] 장바구니 다중 삭제 API
router.delete(
  '/deleteMultiple',
  verifyAccessToken,
  requireMinRole('USER'),
  cartValidator.validateDeleteMultipleFromCart,
  validateRequest,
  cartController.deleteMultipleFromCart
);

export const cartRouter = router;
