import { Router } from 'express';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { requireMinRole } from '../../common/middlewares/role.middleware';
import { validateRequest } from '../../common/middlewares/validator.middleware';
import { productValidator } from './product.validator';
import { productController } from './product.controller';

const router = Router();

// 상품 생성
router.post(
  '/',
  verifyAccessToken,
  requireMinRole('USER'),
  productValidator.validateCreateProduct,
  validateRequest,
  productController.createProduct
);

// 상품 목록 조회
router.get(
  '/',
  verifyAccessToken,
  requireMinRole('USER'),
  productValidator.validateGetProducts,
  validateRequest,
  productController.getProducts
);

// 상품 상세 조회
router.get(
  '/:id',
  verifyAccessToken,
  requireMinRole('USER'),
  productValidator.validateGetProductDetail,
  validateRequest,
  productController.getProductDetail
);

// 상품 수정
router.patch(
  '/:id',
  verifyAccessToken,
  requireMinRole('MANAGER'),
  productValidator.validateUpdateProduct,
  validateRequest,
  productController.updateProduct
);

// 상품 삭제
router.delete(
  '/:id',
  verifyAccessToken,
  requireMinRole('MANAGER'),
  productValidator.validateDeleteProduct,
  validateRequest,
  productController.deleteProduct
);

export const productRouter = router;
