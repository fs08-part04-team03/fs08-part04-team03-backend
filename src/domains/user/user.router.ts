import { Router } from 'express';
import { role } from '@prisma/client';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { requireRoles, requireMinRole } from '../../common/middlewares/role.middleware';
import { uploadSingleImage } from '../upload/upload.middleware';
import { userController } from './user.controller';
import { userValidator } from './user.validator';

const router = Router();

// 프로필 조회
router.get('/me', verifyAccessToken, requireMinRole(role.USER), userController.getProfile);

// 프로필 변경 (비밀번호/이미지) (유저, 매니저)
router.patch(
  '/me/profile',
  verifyAccessToken,
  requireRoles(role.USER, role.MANAGER),
  uploadSingleImage,
  userValidator.patchMyProfile,
  userController.patchMyProfile
);

// 회사명/비밀번호/프로필 이미지 변경 (ADMIN)
router.patch(
  '/admin/profile',
  verifyAccessToken,
  requireRoles(role.ADMIN),
  uploadSingleImage,
  userValidator.patchAdminProfile,
  userController.patchAdminProfile
);

// 회원 권한 변경 (ADMIN)
router.patch(
  '/admin/:id/role',
  verifyAccessToken,
  requireRoles(role.ADMIN),
  userValidator.updateRole,
  userController.updateRole
);

// 회원 탈퇴/활성화 (ADMIN)
router.patch(
  '/admin/:id/status',
  verifyAccessToken,
  requireRoles(role.ADMIN),
  userValidator.updateStatus,
  userController.updateStatus
);

// 회사 소속 유저 조회/검색 (ADMIN)
router.get(
  '/',
  verifyAccessToken,
  requireRoles(role.ADMIN),
  userValidator.getUsers,
  userController.getUsers
);

export const userRouter = router;
