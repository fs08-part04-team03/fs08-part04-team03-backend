import { body, param, query } from 'express-validator';
import { validateRequest } from '../../common/middlewares/validator.middleware';

// 상품 생성 요청 바디 검증
const validateCreateProduct = [
  body('categoryId')
    .notEmpty()
    .withMessage('categoryId는 필수 항목입니다.')
    .isInt({ min: 1 })
    .withMessage('categoryId는 1 이상의 정수여야 합니다.')
    .toInt(),
  body('name')
    .notEmpty()
    .withMessage('name은 필수 항목입니다.')
    .isString()
    .withMessage('name은 문자열이어야 합니다.')
    .isLength({ min: 1, max: 30 })
    .withMessage('name은 1자 이상 30자 이하여야 합니다.')
    .trim(),
  body('price')
    .notEmpty()
    .withMessage('price는 필수 항목입니다.')
    .isInt({ min: 0 })
    .withMessage('price는 0 이상의 정수여야 합니다.')
    .toInt(),
  body('link')
    .notEmpty()
    .withMessage('link는 필수 항목입니다.')
    .isString()
    .withMessage('link는 문자열이어야 합니다.')
    .isLength({ min: 1, max: 255 })
    .withMessage('link는 1자 이상 255자 이하여야 합니다.')
    .trim(),
  validateRequest,
];

// 상품 목록 조회 쿼리 파라미터 검증
const validateGetProducts = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('q').optional().isString().trim().isLength({ min: 1, max: 50 }),
  query('categoryId').optional().isInt({ min: 1 }).toInt(),
  query('sort').optional().isIn(['latest', 'sales', 'priceAsc', 'priceDesc']),
  validateRequest,
];

// 상품 상세 조회 파라미터 검증
const validateGetProductDetail = [
  param('id').notEmpty().withMessage('product id는 필수 항목입니다.').isInt({ min: 1 }).toInt(),
  validateRequest,
];

// 상품 수정 요청 바디 검증
const validateUpdateProduct = [
  param('id').notEmpty().isInt({ min: 1 }).toInt(),
  body().custom((value: unknown, { req }) => {
    const hasBodyField =
      typeof value === 'object' &&
      value !== null &&
      ('categoryId' in value || 'name' in value || 'price' in value || 'link' in value);
    const hasFile = req.file !== undefined;
    const hasRemoveImage = req.query?.removeImage === 'true';

    if (!hasBodyField && !hasFile && !hasRemoveImage) {
      throw new Error('수정할 필드가 최소 1개는 필요합니다.');
    }
    return true;
  }),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('categoryId는 1 이상의 정수여야 합니다.')
    .toInt(),
  body('name')
    .optional()
    .isString()
    .withMessage('name은 문자열이어야 합니다.')
    .isLength({ min: 1, max: 30 })
    .withMessage('name은 1자 이상 30자 이하여야 합니다.')
    .trim(),
  body('price')
    .optional()
    .isInt({ min: 0 })
    .withMessage('price는 0 이상의 정수여야 합니다.')
    .toInt(),
  body('link')
    .optional()
    .isString()
    .withMessage('link는 문자열이어야 합니다.')
    .isLength({ min: 1, max: 255 })
    .withMessage('link는 1자 이상 255자 이하여야 합니다.')
    .trim(),
  validateRequest,
];
// 상품 삭제 파라미터 검증
const validateDeleteProduct = [param('id').notEmpty().isInt({ min: 1 }).toInt(), validateRequest];

export const productValidator = {
  validateCreateProduct,
  validateGetProducts,
  validateGetProductDetail,
  validateUpdateProduct,
  validateDeleteProduct,
};
