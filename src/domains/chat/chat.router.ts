import { Router } from 'express';
import { role } from '@prisma/client';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { verifyTenantAccess } from '../../common/middlewares/tenant.middleware';
import { requireMinRole } from '../../common/middlewares/role.middleware';
import { chatController } from './chat.controller';
import { chatValidator } from './chat.validator';

const router = Router();

// 챗봇 대화 (메인 엔드포인트)
router.post(
  '/',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  chatValidator.validateChatMessage,
  chatController.chat
);

// 자연어 쿼리 처리
router.post(
  '/query',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  chatValidator.validateQuery,
  chatController.query
);

// 상품 추천
router.post(
  '/recommend',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  chatValidator.validateQuery,
  chatController.recommendProducts
);

// 통계 조회
router.post(
  '/statistics',
  verifyAccessToken,
  verifyTenantAccess,
  requireMinRole(role.USER),
  chatValidator.validateQuery,
  chatController.getStatistics
);

export { router as chatRouter };
