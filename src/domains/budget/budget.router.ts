import { Router } from 'express';
import { requireMinRole } from '../../common/middlewares/role.middleware';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { budgetController } from './budget.controller';
import { budgetValidator } from './budget.validator';

const router = Router();

// 월 예산 생성
router.post(
  '/',
  verifyAccessToken,
  requireMinRole('MANAGER'),
  budgetValidator.create,
  budgetController.create
);

// 월 예산 목록 조회
router.get(
  '/',
  verifyAccessToken,
  requireMinRole('MANAGER'),
  budgetValidator.getList,
  budgetController.getList
);

// 월 예산 수정
router.patch(
  '/:budgetId',
  verifyAccessToken,
  requireMinRole('MANAGER'),
  budgetValidator.update,
  budgetController.update
);

export const budgetRouter = router;
