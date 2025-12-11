import { query } from 'express-validator';

const validatePurchaseList = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'totalPrice']),
  query('order').optional().isIn(['asc', 'desc']),
];

export const purchaseValidator = {
  validatePurchaseList,
};
