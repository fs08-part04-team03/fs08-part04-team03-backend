import { body, param } from 'express-validator';
import { validateRequest } from '../../common/middlewares/validator.middleware';

export const invitationValidator = {
  // 초대 생성 요청 검증
  create: [
    body('email')
      .isEmail()
      .withMessage('email은 올바른 이메일 형식이어야 합니다.')
      .normalizeEmail(), // 이메일 정규화 (이미 안전함)
    body('name')
      .isString()
      .withMessage('name은 문자열이어야 합니다.')
      .trim()
      .escape() // XSS 방지: HTML 특수문자 이스케이프
      .isLength({ min: 1, max: 255 })
      .withMessage('name은 1~255자여야 합니다.'),
    body('role')
      .isIn(['USER', 'MANAGER', 'ADMIN'])
      .withMessage('role은 USER, MANAGER, ADMIN 중 하나여야 합니다.'),
    validateRequest,
  ],

  // 토큰 파라미터 검증
  tokenParam: [
    param('token').isUUID().withMessage('token은 UUID 형식이어야 합니다.'),
    validateRequest,
  ],
};
