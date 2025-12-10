import { Router } from 'express';
import { requireMinRole } from '../../common/middlewares/role.middleware';
import { verifyAccessToken } from '../../common/middlewares/auth.middleware';
import { budgetController } from './budget.controller';
import { budgetValidator } from './budget.validator';

const router = Router();

// 예산 기준 insert + update
router.patch(
  '/criteria',
  verifyAccessToken,
  requireMinRole('ADMIN'),
  budgetValidator.upsertCriteria,
  budgetController.upsertCriteria
);

// 예산 기준 조회
router.get('/criteria', verifyAccessToken, requireMinRole('ADMIN'), budgetController.getCriteria);

// 월 예산 생성
router.post(
  '/',
  verifyAccessToken,
  requireMinRole('ADMIN'),
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
  requireMinRole('ADMIN'),
  budgetValidator.update,
  budgetController.update
);

export const budgetRouter = router;
