import { body, type CustomValidator } from 'express-validator';
import { validateRequest } from '../../common/middlewares/validator.middleware';

const passwordRule = body('password')
  .isLength({ min: 8, max: 30 })
  .isStrongPassword({
    minLength: 8,
    minLowercase: 0,
    minUppercase: 0,
    minNumbers: 1,
    minSymbols: 1,
  })
  .withMessage('password는 숫자/특수문자 포함 8~30자여야 합니다');

type SignupBody = { password?: string };
const passwordMatchValidator: CustomValidator = (v, { req }) =>
  v === (req.body as SignupBody).password;

export const authValidator = {
  signup: [
    body('name').isString().trim().isLength({ min: 1, max: 255 }).withMessage('name은 1~255자'),
    body('email').isEmail().withMessage('email 형식이 올바르지 않습니다').toLowerCase(),
    passwordRule,
    body('passwordConfirm')
      .custom(passwordMatchValidator)
      .withMessage('passwordConfirm이 password와 다릅니다'),
    body('inviteToken').isUUID().withMessage('inviteToken은 UUID 형식이어야 합니다'),
    validateRequest,
  ],
  login: [
    body('email').isEmail().withMessage('email 형식이 올바르지 않습니다').toLowerCase(),
    passwordRule,
    validateRequest,
  ],
};
