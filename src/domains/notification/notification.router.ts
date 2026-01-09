import { Router } from 'express';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { requireMinRole } from '../../common/middlewares/role.middleware';
import { notificationController } from './notification.controller';
import { notificationValidator } from './notification.validator';

const router = Router();

// SSE 연결
router.get('/stream', verifyAccessToken, requireMinRole('USER'), notificationController.stream);

// 알림 리스트 조회
router.get(
  '/',
  verifyAccessToken,
  requireMinRole('USER'),
  notificationValidator.list,
  notificationController.list
);

// 읽지 않은 알림 개수 조회
router.get(
  '/unread-count',
  verifyAccessToken,
  requireMinRole('USER'),
  notificationController.unreadCount
);

// 알림 읽음 처리
router.patch(
  '/:id/read',
  verifyAccessToken,
  requireMinRole('USER'),
  notificationValidator.markRead,
  notificationController.markRead
);

export const notificationRouter = router;
