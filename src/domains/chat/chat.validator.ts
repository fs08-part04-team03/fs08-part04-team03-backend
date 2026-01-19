import { body } from 'express-validator';
import { validateRequest } from '../../common/middlewares/validator.middleware';

export const chatValidator = {
  // 챗봇 메시지 유효성 검사
  validateChatMessage: [
    body('message')
      .isString()
      .notEmpty()
      .withMessage('메시지를 입력해주세요.')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('메시지는 1자 이상 1000자 이하로 입력해주세요.'),
    body('chatHistory').optional().isArray().withMessage('대화 기록은 배열이어야 합니다.'),
    validateRequest,
  ],

  // 쿼리 유효성 검사
  validateQuery: [
    body('query')
      .isString()
      .notEmpty()
      .withMessage('쿼리를 입력해주세요.')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('쿼리는 1자 이상 1000자 이하로 입력해주세요.'),
    validateRequest,
  ],
};
