import { query, body } from 'express-validator';
import { validateRequest } from '../../common/middlewares/validator.middleware';

export const companyValidator = {
  // 회사 소속 유저 조회 검증
  getUsers: [
    query('role').optional().isIn(['USER', 'MANAGER', 'ADMIN']),
    query('isActive').optional().isBoolean().toBoolean(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    validateRequest,
  ],
  // 회사명 변경 검증
  updateName: [body('name').isString().trim().isLength({ min: 1, max: 255 }), validateRequest],
};
