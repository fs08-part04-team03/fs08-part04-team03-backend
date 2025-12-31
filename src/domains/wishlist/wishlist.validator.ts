import { param, query } from 'express-validator';
import { validateRequest } from '../../common/middlewares/validator.middleware';

export const wishlistValidator = {
  // 찜 등록
  createWishlist: [param('id').isInt({ min: 1 }).toInt(), validateRequest],

  // 내 찜 목록 조회
  getMyWishlist: [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sort').optional().isIn(['asc', 'desc']),
    validateRequest,
  ],

  // 찜 해제
  deleteWishlist: [param('id').isInt({ min: 1 }).toInt(), validateRequest],
};
