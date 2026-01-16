import { Router } from 'express';
import { role } from '@prisma/client';
import { requireMinRole } from '../../common/middlewares/role.middleware';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { verifyTenantAccess } from '../../common/middlewares/tenant.middleware';
import { validateRequest } from '../../common/middlewares/validator.middleware';
import { cartValidator } from './cart.validator';
import { cartController } from './cart.controller';

const router = Router();

// 🛒 [Cart] 장바구니에 상품 추가 API
router.post(
  '/addToCart',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  cartValidator.validateAddToCart,
  validateRequest,
  cartController.addToCart
);

// 🛒 [Cart] 내 장바구니 조회 API
router.get(
  '/getMyCart',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  cartValidator.validateGetMyCart,
  validateRequest,
  cartController.getMyCart
);

// 🛒 [Cart] 장바구니 수량 수정 API
router.patch(
  '/updateQuantity',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  cartValidator.validateUpdateQuantity,
  validateRequest,
  cartController.updateQuantity
);

// 🛒 [Cart] 장바구니 삭제 API
router.delete(
  '/deleteFromCart',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  cartValidator.validateDeleteFromCart,
  validateRequest,
  cartController.deleteFromCart
);

// 🛒 [Cart] 장바구니 다중 삭제 API
router.delete(
  '/deleteMultiple',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  cartValidator.validateDeleteMultipleFromCart,
  validateRequest,
  cartController.deleteMultipleFromCart
);

export const cartRouter = router;
