import { Router } from 'express';
import { role } from '@prisma/client';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { verifyTenantAccess } from '../../common/middlewares/tenant.middleware';
import { requireMinRole } from '../../common/middlewares/role.middleware';
import { validateRequest } from '../../common/middlewares/validator.middleware';
import { uploadSingleImage } from '../upload/upload.middleware';
import { productValidator } from './product.validator';
import { productController } from './product.controller';

const router = Router();

// 상품 생성
router.post(
  '/',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  uploadSingleImage,
  productValidator.validateCreateProduct,
  validateRequest,
  productController.createProduct
);

// 상품 목록 조회
router.get(
  '/',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  productValidator.validateGetProducts,
  validateRequest,
  productController.getProducts
);

// 내가 등록한 상품 목록 조회
router.get(
  '/my',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  productValidator.validateGetProducts,
  validateRequest,
  productController.getMyProducts
);

// 상품 상세 조회
router.get(
  '/:id',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  productValidator.validateGetProductDetail,
  validateRequest,
  productController.getProductDetail
);

// 상품 수정
router.patch(
  '/:id',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.MANAGER),
  uploadSingleImage,
  productValidator.validateUpdateProduct,
  validateRequest,
  productController.updateProduct
);

// 상품 삭제
router.delete(
  '/:id',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.MANAGER),
  productValidator.validateDeleteProduct,
  validateRequest,
  productController.deleteProduct
);

export const productRouter = router;
