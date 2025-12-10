import { body, query, param } from 'express-validator';
import { validateRequest } from '../../common/middlewares/validator.middleware';

export const budgetValidator = {
  // 월 별 예산 생성
  create: [
    body('year').isInt({ min: 2000, max: 2100 }).toInt(),
    body('month').isInt({ min: 1, max: 12 }).toInt(),
    body('amount').isInt({ min: 0 }).toInt(),
    validateRequest,
  ],

  // 월 별 예산 수정
  update: [
    param('budgetId').isString().isLength({ min: 10 }),
    body('amount').isInt({ min: 0 }).toInt(),
    validateRequest,
  ],

  // 예산 목록 조회
  getList: [
    query('year').optional().isInt({ min: 2000, max: 2100 }).toInt(),
    query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
    validateRequest,
  ],

  // 예산 기준 update + insert
  upsertCriteria: [body('amount').isInt({ min: 0 }).toInt(), validateRequest],
};
