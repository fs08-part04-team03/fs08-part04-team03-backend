import { Router } from 'express';
import { role } from '@prisma/client';
import { requireMinRole } from '../../common/middlewares/role.middleware';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { wishlistValidator } from './wishlist.validator';
import { wishlistController } from './wishlist.controller';

const router = Router();

// 찜 등록: POST /api/v1/wishlist/:id
router.post(
  '/:id',
  verifyAccessToken,
  requireMinRole(role.USER),
  wishlistValidator.createWishlist,
  wishlistController.createWishlist
);

// 내 찜 목록: GET /api/v1/wishlist/my
router.get(
  '/my',
  verifyAccessToken,
  requireMinRole(role.USER),
  wishlistValidator.getMyWishlist,
  wishlistController.getMyWishlist
);

// 찜 해제: DELETE /api/v1/wishlist/:id
router.delete(
  '/:id',
  verifyAccessToken,
  requireMinRole(role.USER),
  wishlistValidator.deleteWishlist,
  wishlistController.deleteWishlist
);

export const wishlistRouter = router;
