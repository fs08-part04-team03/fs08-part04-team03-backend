import { body, query, param } from 'express-validator';
import { validateRequest } from '../../common/middlewares/validator.middleware';

export const budgetValidator = {
  create: [
    body('year').isInt({ min: 2000, max: 2100 }).toInt(),
    body('month').isInt({ min: 1, max: 12 }).toInt(),
    body('amount').isInt({ min: 0 }).toInt(),
    validateRequest,
  ],

  update: [
    param('budgetId').isString().isLength({ min: 10 }),
    body('amount').isInt({ min: 0 }).toInt(),
    validateRequest,
  ],

  getList: [
    query('year').optional().isInt({ min: 2000, max: 2100 }).toInt(),
    query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
    validateRequest,
  ],
};
