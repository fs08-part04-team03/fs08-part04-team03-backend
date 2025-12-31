import { Request, Response } from 'express';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { ResponseUtil } from '../../common/utils/response.util';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import { wishlistService } from './wishlist.service';

type ProductIdParam = { id: string };
type GetMyWishlistRequest = AuthenticatedRequest &
  Request<unknown, unknown, unknown, { page?: string; limit?: string; sort?: string }>;

const requireUserContext = (req: AuthenticatedRequest) => {
  if (!req.user) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_UNAUTHORIZED,
      '인증 정보가 없습니다.'
    );
  }
  return req.user;
};

export const wishlistController = {
  // 찜 등록
  createWishlist: async (req: AuthenticatedRequest & Request<ProductIdParam>, res: Response) => {
    const { id: userId } = requireUserContext(req);
    const productId = Number(req.params.id);

    const result = await wishlistService.createWishlist(userId, productId);
    res
      .status(HttpStatus.CREATED)
      .json(
        ResponseUtil.success(result.item, result.isNew ? '찜 등록 성공' : '이미 찜된 상품입니다.')
      );
  },

  // 내 찜 목록 조회
  getMyWishlist: async (req: GetMyWishlistRequest, res: Response) => {
    const { id: userId } = requireUserContext(req);
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const sort = (req.query.sort as 'asc' | 'desc') || 'desc';

    const result = await wishlistService.getMyWishlist(userId, page, limit, sort);
    res
      .status(HttpStatus.OK)
      .json(
        ResponseUtil.successWithPagination(result.items, result.pagination, '찜 목록 조회 성공')
      );
  },

  // 찜 해제
  deleteWishlist: async (req: AuthenticatedRequest & Request<ProductIdParam>, res: Response) => {
    const { id: userId } = requireUserContext(req);
    const productId = Number(req.params.id);

    const result = await wishlistService.deleteWishlist(userId, productId);
    res.status(HttpStatus.OK).json(ResponseUtil.success(result, '찜 해제 성공'));
  },
};
