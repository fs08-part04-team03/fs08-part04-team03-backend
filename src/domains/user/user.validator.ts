import { body, param, query } from 'express-validator';
import { validateRequest } from '../../common/middlewares/validator.middleware';
import type { AdminProfilePatchBody, UserProfilePatchBody } from './user.types';

export const userValidator = {
  // 유저/매니저: 비밀번호 변경
  patchMyProfile: [
    body('newPassword')
      .isLength({
        min: 8,
        max: 30,
      })
      .isStrongPassword({
        minLength: 8,
        minLowercase: 0,
        minUppercase: 0,
        minNumbers: 1,
        minSymbols: 1,
      }),
    body('newPasswordConfirm')
      .isString()
      .custom((val, { req }) => {
        const { newPassword } = req.body as UserProfilePatchBody;
        return val === newPassword;
      })
      .withMessage('비밀번호 확인이 일치하지 않습니다.'),
    validateRequest,
  ],

  // 어드민: 회사명/비밀번호 변경
  patchAdminProfile: [
    body('companyName').optional().isString().trim().isLength({ min: 1, max: 255 }),
    body('newPassword')
      .optional()
      .isLength({
        min: 8,
        max: 30,
      })
      .isStrongPassword({
        minLength: 8,
        minLowercase: 0,
        minUppercase: 0,
        minNumbers: 1,
        minSymbols: 1,
      }),
    body('newPasswordConfirm')
      .if(body('newPassword').exists())
      .exists({ checkFalsy: true })
      .withMessage('새 비밀번호 확인은 필수입니다.')
      .bail()
      .isString()
      .custom((val, { req }) => {
        const { newPassword } = req.body as AdminProfilePatchBody;
        return val === newPassword;
      })
      .withMessage('새 비밀번호와 확인값이 일치해야 합니다.'),
    body()
      .custom((_, { req }) => {
        const { companyName, newPassword } = req.body as AdminProfilePatchBody;
        return !!companyName || !!newPassword;
      })
      .withMessage('회사명 또는 새 비밀번호 중 하나는 반드시 포함되어야 합니다.'),
    validateRequest,
  ],

  // 권한 변경
  updateRole: [
    param('id').isUUID(),
    body('role').isIn(['USER', 'MANAGER', 'ADMIN']),
    validateRequest,
  ],

  // 활성/비활성 변경
  updateStatus: [param('id').isUUID(), body('isActive').isBoolean().toBoolean(), validateRequest],

  // 회사 소속 사용자 목록 조회/검색
  getUsers: [
    query('q').optional().isString().trim().isLength({ min: 1, max: 255 }),
    query('role').optional().isIn(['USER', 'MANAGER', 'ADMIN']),
    query('isActive').optional().isBoolean().toBoolean(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    validateRequest,
  ],
};
