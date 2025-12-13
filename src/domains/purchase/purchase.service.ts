import { prisma } from '../../common/database/prisma.client';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import type { GetAllPurchasesQuery, PurchaseItemRequest } from './purchase.types';

export const purchaseService = {
  // 💰 [Purchase] 전체 구매 내역 목록 API (관리자)
  async getAllPurchases(companyId: string, query: GetAllPurchasesQuery) {
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
        companyId,
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
        companyId,
      },
      orderBy: {
        [sortBy]: order,
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: {
        ...purchaseList,
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  },

  // 💰 [Purchase] 즉시 구매 API (관리자)
  async purchaseNow(
    companyId: string,
    userId: string,
    shippingFee: number,
    items: PurchaseItemRequest[]
  ) {
    // 1. 상품 정보 조회 (가격 스냅샷 용)
    const productIds = items.map((item) => item.productId);
    const products = await prisma.products.findMany({
      where: {
        id: { in: productIds },
        companyId, // 내 회사의 상품인지 확인
        isActive: true, // 활성화된 상품만 조회
      },
    });

    const totalPrice = products.reduce((acc, product) => {
      const quantity = items.find((item) => item.productId === product.id)?.quantity || 0;
      return acc + product.price * quantity;
    }, 0);

    if (products.length !== items.length) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '존재하지 않는 상품이 포함되어 있거나, 다른 회사의 상품입니다.'
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 2. 구매 요청 생성
      const newPurchaseRequest = await tx.purchaseRequests.create({
        data: {
          companyId,
          requesterId: userId,
          totalPrice,
          shippingFee,
          approverId: userId, // 즉시 구매이므로 요청자가 승인자
          status: 'APPROVED', // 즉시 구매이므로 바로 승인 처리
        },
      });

      // 3. 구매 항목 생성
      const purchaseItemsData = items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error('상품 정보를 찾을 수 없습니다.'); // Should not happen due to previous check
        }
        return {
          purchaseRequestId: newPurchaseRequest.id,
          productId: item.productId,
          quantity: item.quantity,
          priceSnapshot: product.price,
        };
      });

      await tx.purchaseItems.createMany({
        data: purchaseItemsData,
      });

      return newPurchaseRequest;
    });

    return { data: result };
  },

  async getMyPurchases(companyId: string, userId: string, query: GetAllPurchasesQuery) {
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
        companyId,
        requesterId: userId,
      },
    });

    // 데이터 조회
    const purchaseList = await prisma.purchaseRequests.findMany({
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        totalPrice: true,
        status: true,
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
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      where: {
        companyId,
        requesterId: userId,
      },
      orderBy: {
        [sortBy]: order,
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: {
        ...purchaseList,
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
