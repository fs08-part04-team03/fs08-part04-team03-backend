import { query, ValidationChain } from 'express-validator';
import { purchaseStatus, role as RoleEnum } from '@prisma/client';

export const validateExportPurchaseRequests: ValidationChain[] = [
  query('from')
    .notEmpty()
    .withMessage('시작 일시는 필수입니다.')
    .bail()
    .isISO8601()
    .withMessage('ISO 8601 형식이어야 합니다.'),
  query('to')
    .notEmpty()
    .withMessage('종료 일시는 필수입니다.')
    .bail()
    .isISO8601()
    .withMessage('ISO 8601 형식이어야 합니다.')
    .bail()
    .custom((value, { req }) => {
      const fromRaw = (req?.query?.from as string | undefined) ?? undefined;
      if (!fromRaw) return true;
      const fromDate = new Date(fromRaw);
      const toDate = new Date(String(value));
      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        return true;
      }
      if (fromDate > toDate) {
        throw new Error('시작 일시는 종료 일시보다 이전이거나 같아야 합니다.');
      }
      return true;
    }),
  query('status')
    .optional()
    .isIn([purchaseStatus.APPROVED, purchaseStatus.REJECTED])
    .withMessage('status는 APPROVED 또는 REJECTED여야 합니다.'),
  query('role')
    .optional()
    .isIn([...Object.values(RoleEnum), 'ALL'])
    .withMessage('role은 USER, MANAGER, ADMIN, 또는 ALL이어야 합니다.'),
];
