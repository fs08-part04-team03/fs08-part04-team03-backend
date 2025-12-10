import { prisma } from '@/common/database/prisma.client';
import type { GetAllPurchasesQuery } from './purchase.types';

export const purchaseService = {
  // 💰 [Purchase] 전체 구매 내역 목록 API (관리자)
  async getAllPurchases(approverId: string, query: GetAllPurchasesQuery) {
    // 기본 값 설정
    const page = query.page || 1;
    const limit = query.limit || 10;
    const sortBy = query.sortBy || 'createdAt';
    const order = query.order || 'desc';
    // 건너뛸 항목 수 계산
    const skip = (page - 1) * limit;

    // 전체 개수 조회
    const totalItems = await prisma.purchaseRequests.count({
      where: {
        approverId,
      },
    });

    // 데이터: 요청일, 요청인, 상품명, 가격, 승인일, 담당자
    const purchaseList = await prisma.purchaseRequests.findMany({
      select: {
        id: true,
        createdAt: true, // 구매 요청일
        updatedAt: true, // 구매 승인일
        totalPrice: true, // 주문 금액
        status: true,
        // 상품명
        purchaseItems: {
          select: {
            quantity: true,
            priceSnapshot: true,
            products: {
              select: {
                name: true,
              },
            },
          },
        },
        requester: {
          // 요청인 정보
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          // 담당자 정보
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      where: {
        approverId,
      },
      orderBy: {
        [sortBy]: order,
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: purchaseList,
      meta: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  },
};
