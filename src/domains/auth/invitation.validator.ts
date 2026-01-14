import { body, param } from 'express-validator';
import { role } from '@prisma/client';
import { validateRequest } from '../../common/middlewares/validator.middleware';

export const invitationValidator = {
  // 초대 생성 요청 검증
  create: [
    body('email')
      .isEmail()
      .withMessage('email은 올바른 이메일 형식이어야 합니다.')
      .normalizeEmail(),
    body('name')
      .isString()
      .withMessage('name은 문자열이어야 합니다.')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('name은 1~255자여야 합니다.'),
    body('role')
      .isIn(Object.values(role))
      .withMessage(`role은 ${Object.values(role).join(', ')} 중 하나여야 합니다.`),
    validateRequest,
  ],

  // 토큰 파라미터 검증
  tokenParam: [
    param('token').isUUID().withMessage('token은 UUID 형식이어야 합니다.'),
    validateRequest,
  ],
};
