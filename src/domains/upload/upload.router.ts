import { Router } from 'express';
import { role } from '@prisma/client';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { verifyTenantAccess } from '../../common/middlewares/tenant.middleware';
import { requireMinRole } from '../../common/middlewares/role.middleware';
import { uploadController } from './upload.controller';
import { uploadSingleImage, uploadMultipleImages } from './upload.middleware';

const router = Router();

/**
 * 단일 이미지 업로드
 * POST /api/v1/upload/image
 * - 인증 필요
 * - USER 이상 권한 필요
 * - 쿼리 파라미터: folder (선택, 기본값: 'misc')
 * - 폼 데이터: image (파일)
 */
router.post(
  '/image',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  uploadSingleImage,
  uploadController.uploadImage
);

/**
 * 여러 이미지 업로드
 * POST /api/v1/upload/images
 * - 인증 필요
 * - USER 이상 권한 필요
 * - 쿼리 파라미터: folder (선택, 기본값: 'misc')
 * - 폼 데이터: images[] (파일 배열, 최대 10개)
 */
router.post(
  '/images',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  uploadMultipleImages,
  uploadController.uploadMultipleImages
);

/**
 * 이미지 URL 조회
 * GET /api/v1/upload/image/:key
 * - 인증 필요
 * - USER 이상 권한 필요
 * - URL 파라미터: key (S3 객체 키, URL 인코딩 필요)
 */
router.get(
  '/image/:key',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  uploadController.getImageUrl
);

/**
 * 이미지 삭제
 * DELETE /api/v1/upload/image/:key
 * - 인증 필요
 * - MANAGER 이상 권한 필요 (삭제는 관리자만)
 * - URL 파라미터: key (S3 객체 키, URL 인코딩 필요)
 */
router.delete(
  '/image/:key',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.MANAGER),
  uploadController.deleteImage
);

export const uploadRouter = router;
