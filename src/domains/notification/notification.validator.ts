import { param, query } from 'express-validator';
import { validateRequest } from '../../common/middlewares/validator.middleware';

export const notificationValidator = {
  // 알림 리스트
  list: [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    validateRequest,
  ],
  // 읽음처리
  markRead: [param('id').isInt({ min: 1 }), validateRequest],
};
