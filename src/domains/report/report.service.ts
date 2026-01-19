import { purchaseStatus, type Prisma } from '@prisma/client';
import { prisma } from '../../common/database/prisma.client';
import type {
  ExportPurchaseRequestsCursor,
  ExportPurchaseRequestsFilters,
  PurchaseRequestExportItem,
} from './report.types';

export const REPORT_EXPORT_MAX_ROWS = 50000;
const REPORT_EXPORT_BATCH_SIZE = 1000;
const EXPORT_DECISION_STATUSES = [purchaseStatus.APPROVED, purchaseStatus.REJECTED];

const buildExportWhere = (
  filters: ExportPurchaseRequestsFilters,
  cursor?: ExportPurchaseRequestsCursor
): Prisma.purchaseRequestsWhereInput => {
  const statuses = filters.status ? [filters.status] : EXPORT_DECISION_STATUSES;
  const where: Prisma.purchaseRequestsWhereInput = {
    companyId: filters.companyId,
    status: { in: statuses },
    updatedAt: { gte: filters.from, lte: filters.to },
  };

  if (filters.requesterRole && filters.requesterRole !== 'ALL') {
    where.requester = { role: filters.requesterRole };
  }

  if (cursor) {
    where.OR = [
      { updatedAt: { gt: cursor.updatedAt } },
      { updatedAt: cursor.updatedAt, id: { gt: cursor.id } },
    ];
  }

  return where;
};

export const reportService = {
  // report를 위해 구매 요청 전체 건수 조회
  async countExportPurchaseRequests(filters: ExportPurchaseRequestsFilters) {
    const where = buildExportWhere(filters);
    return prisma.purchaseRequests.count({ where });
  },

  // report를 위해 구매 요청 배치 조회
  async fetchExportPurchaseRequestsBatch(
    filters: ExportPurchaseRequestsFilters,
    cursor?: ExportPurchaseRequestsCursor
  ): Promise<PurchaseRequestExportItem[]> {
    const where = buildExportWhere(filters, cursor);

    // excel 내보내기를 위한 구매 요청 데이터 조회
    return prisma.purchaseRequests.findMany({
      where,
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      take: REPORT_EXPORT_BATCH_SIZE,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        totalPrice: true,
        shippingFee: true,
        requestMessage: true,
        reason: true,
        rejectReason: true,
        requester: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        approver: {
          select: {
            name: true,
            email: true,
          },
        },
        purchaseItems: {
          select: {
            quantity: true,
            products: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            productId: 'asc',
          },
        },
      },
    });
  },
};
