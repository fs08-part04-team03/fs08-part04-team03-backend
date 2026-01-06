import { Response } from 'express';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { ResponseUtil } from '../../common/utils/response.util';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import { productService } from './product.service';
import type {
  CreateProductBody,
  ProductListQuery,
  ProductSort,
  UpdateProductBody,
} from './product.types';

// 회사 ID 가져오기
const getCompanyId = (req: AuthenticatedRequest) => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_UNAUTHORIZED,
      '회사 정보가 없습니다.'
    );
  }
  return companyId;
};

const getUserId = (req: AuthenticatedRequest) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_UNAUTHORIZED,
      '사용자 정보가 없습니다.'
    );
  }
  return userId;
};

// 상품 생성
export const productController = {
  createProduct: async (req: AuthenticatedRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const userId = getUserId(req);
    const payload = req.body as CreateProductBody;
    const { file } = req;

    const product = await productService.createProduct(companyId, userId, payload, file);
    res
      .status(HttpStatus.CREATED)
      .json(ResponseUtil.success(product, '상품 등록이 완료되었습니다.'));
  },

  // 상품 목록 조회
  getProducts: async (req: AuthenticatedRequest, res: Response) => {
    const companyId = getCompanyId(req);
    // 쿼리 파라미터 (페이지네이션, 카테고리, 정렬)
    const query: ProductListQuery = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
      sort: req.query.sort as ProductSort | undefined,
    };

    const result = await productService.getProducts(companyId, query);
    res
      .status(HttpStatus.OK)
      .json(
        ResponseUtil.successWithPagination(
          result.products,
          { page: result.page, limit: result.limit, total: result.total },
          '상품 목록을 조회했습니다.'
        )
      );
  },

  // 내가 등록한 상품 목록 조회
  getMyProducts: async (req: AuthenticatedRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const userId = getUserId(req);
    const query: ProductListQuery = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
      sort: req.query.sort as ProductSort | undefined,
    };

    const result = await productService.getProducts(companyId, query, userId);
    res
      .status(HttpStatus.OK)
      .json(
        ResponseUtil.successWithPagination(
          result.products,
          { page: result.page, limit: result.limit, total: result.total },
          '내가 등록한 상품 목록을 조회했습니다.'
        )
      );
  },

  // 상품 상세 조회
  getProductDetail: async (req: AuthenticatedRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const productId = Number(req.params.id);
    const product = await productService.getProductDetail(companyId, productId);
    res.status(HttpStatus.OK).json(ResponseUtil.success(product, '상품 상세 정보를 조회했습니다.'));
  },

  // 상품 수정
  updateProduct: async (req: AuthenticatedRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const userId = getUserId(req);
    const productId = Number(req.params.id);
    const payload = req.body as UpdateProductBody;
    const { file } = req;
    const removeImage = req.query.removeImage === 'true';

    const product = await productService.updateProduct(
      companyId,
      userId,
      productId,
      payload,
      file,
      removeImage
    );
    res.status(HttpStatus.OK).json(ResponseUtil.success(product, '상품이 수정되었습니다.'));
  },

  // 상품 삭제
  deleteProduct: async (req: AuthenticatedRequest, res: Response) => {
    const companyId = getCompanyId(req);
    const productId = Number(req.params.id);

    const product = await productService.deleteProduct(companyId, productId);
    res.status(HttpStatus.OK).json(ResponseUtil.success(product, '상품이 삭제되었습니다.'));
  },
};
