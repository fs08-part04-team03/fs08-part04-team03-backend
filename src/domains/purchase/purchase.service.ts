import { purchaseStatus } from '@prisma/client';
import { prisma } from '../../common/database/prisma.client';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import type {
  GetAllPurchasesQuery,
  PurchaseItemRequest,
  RejectPurchaseRequestBody,
} from './purchase.types';

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
        purchaseList,
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

  // 💰 [Purchase] 내 구매 내역 조회 API
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
        purchaseList,
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  },

  // 💰 [Purchase] 내 구매 상세 조회 API
  async getMyPurchaseDetail(companyId: string, userId: string, purchaseRequestId: string) {
    // 구매 요청 상세 조회 (본인의 구매 요청만)
    const purchaseDetail = await prisma.purchaseRequests.findFirst({
      where: {
        id: purchaseRequestId,
        companyId,
        requesterId: userId, // 본인의 구매 요청만 조회 가능
      },
      select: {
        id: true,
        createdAt: true, // 요청일
        updatedAt: true, // 승인/반려일
        totalPrice: true, // 가격
        shippingFee: true, // 배송비
        status: true, // 상태
        requestMessage: true, // 요청 비고
        rejectReason: true, // 반려 사유
        purchaseItems: {
          // 상품 정보
          select: {
            id: true,
            quantity: true,
            priceSnapshot: true,
            products: {
              select: {
                id: true,
                name: true,
                image: true,
                link: true,
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
          // 승인자/반려자 정보
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!purchaseDetail) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.PURCHASE_NOT_FOUND,
        '구매 요청을 찾을 수 없습니다.'
      );
    }

    return { data: purchaseDetail };
  },

  // 💰 [Purchase] 구매 요청 확인 API (관리자)
  async managePurchaseRequests(
    companyId: string,
    query: GetAllPurchasesQuery & { status?: purchaseStatus }
  ) {
    // 기본 값 설정
    const page = query.page || 1;
    const limit = query.limit || 10;
    const sortBy = query.sortBy || 'createdAt';
    const order = query.order || 'desc';
    const { status } = query;
    // 건너뛸 항목 수 계산
    const skip = (page - 1) * limit;

    if (status && !Object.values(purchaseStatus).includes(status)) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_BAD_REQUEST,
        `유효하지 않은 상태 값입니다. 허용되는 값: ${Object.values(purchaseStatus).join(', ')}`
      );
    }

    // 전체 개수 조회
    const totalItems = await prisma.purchaseRequests.count({
      where: { status, companyId },
    });

    // 데이터 조회
    const purchaseRequests = await prisma.purchaseRequests.findMany({
      where: { status, companyId },
      orderBy: {
        [sortBy]: order,
      },
      skip,
      take: limit,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
      },
    });

    const totalPages = Math.ceil(totalItems / limit);
    return {
      data: {
        purchaseRequests,
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  },

  // 💰 [Purchase] 구매 요청 승인 API (관리자)
  async approvePurchaseRequest(companyId: string, userId: string, purchaseRequestId: string) {
    // 구매 요청 존재 여부 확인 (회사 범위 포함)
    const purchaseRequest = await prisma.purchaseRequests.findFirst({
      where: {
        id: purchaseRequestId,
        companyId,
      },
    });

    if (!purchaseRequest) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.PURCHASE_NOT_FOUND,
        '구매 요청을 찾을 수 없습니다.'
      );
    }

    if (purchaseRequest.status !== 'PENDING') {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '이미 처리된 구매 요청입니다.'
      );
    }

    // status = PENDING 조건까지 포함해서 원자적으로 승인 처리
    const updateResult = await prisma.purchaseRequests.updateMany({
      where: {
        id: purchaseRequestId,
        companyId,
        status: 'PENDING',
      },
      data: {
        status: 'APPROVED',
        approverId: userId,
      },
    });

    if (updateResult.count === 0) {
      // 다른 트랜잭션에서 먼저 처리된 경우
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '이미 처리된 구매 요청입니다.'
      );
    }

    const updatedPurchaseRequest = await prisma.purchaseRequests.findFirst({
      where: {
        id: purchaseRequestId,
        companyId,
      },
    });

    return { data: updatedPurchaseRequest };
  },

  // 💰 [Purchase] 구매 요청 반려 API (관리자)
  async rejectPurchaseRequest(
    companyId: string,
    userId: string,
    purchaseRequestId: string,
    body: RejectPurchaseRequestBody
  ) {
    // 구매 요청 존재 여부 확인 (회사 범위 포함)
    const purchaseRequest = await prisma.purchaseRequests.findFirst({
      where: {
        id: purchaseRequestId,
        companyId,
      },
    });

    if (!purchaseRequest) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.PURCHASE_NOT_FOUND,
        '구매 요청을 찾을 수 없습니다.'
      );
    }

    if (purchaseRequest.status !== 'PENDING') {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '이미 처리된 구매 요청입니다.'
      );
    }

    // status = PENDING 조건까지 포함해서 원자적으로 반려 처리
    const updateResult = await prisma.purchaseRequests.updateMany({
      where: {
        id: purchaseRequestId,
        companyId,
        status: 'PENDING',
      },
      data: {
        status: 'REJECTED',
        approverId: userId,
        rejectReason: body.reason,
      },
    });

    if (updateResult.count === 0) {
      // 다른 트랜잭션에서 먼저 처리된 경우
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '이미 처리된 구매 요청입니다.'
      );
    }

    const updatedPurchaseRequest = await prisma.purchaseRequests.findFirst({
      where: {
        id: purchaseRequestId,
        companyId,
      },
    });

    return { data: updatedPurchaseRequest };
  },

  // 💰 [Purchase] 구매 요청 API
  async requestPurchase(
    companyId: string,
    userId: string,
    productId: number,
    quantity: number,
    requestMessage?: string,
    shippingFee: number = 3000
  ) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cart 테이블에서 요청한 상품들이 있는지 확인
      const cartItem = await prisma.carts.findFirst({
        where: {
          userId,
          productId,
        },
        include: {
          products: true,
        },
      });

      // 2. 처리에 필요한 값들이 있는지 확인
      // 장바구니에 상품이 없는 경우
      if (!cartItem) {
        throw new CustomError(
          HttpStatus.BAD_REQUEST,
          ErrorCodes.PURCHASE_CART_ITEM_NOT_FOUND,
          `상품 ID ${productId}가 장바구니에 존재하지 않습니다.`
        );
      }

      // 수량 일치 확인
      if (cartItem.quantity !== quantity) {
        throw new CustomError(
          HttpStatus.BAD_REQUEST,
          ErrorCodes.PURCHASE_CART_ITEM_MISMATCH,
          `상품 ID ${productId}의 수량이 장바구니와 일치하지 않습니다. (장바구니: ${cartItem.quantity}, 요청: ${quantity})`
        );
      }

      // 상품이 활성화되어 있고, 같은 회사의 상품인지 확인
      if (!cartItem.products.isActive || cartItem.products.companyId !== companyId) {
        throw new CustomError(
          HttpStatus.BAD_REQUEST,
          ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
          `상품 ID ${productId}는 구매할 수 없는 상품입니다.`
        );
      }

      // 3. 총 가격 계산
      const totalPrice = cartItem.products.price * cartItem.quantity;

      // 4. 구매 요청 생성
      const newPurchaseRequest = await tx.purchaseRequests.create({
        data: {
          companyId,
          requesterId: userId,
          totalPrice,
          shippingFee,
          status: 'PENDING',
          requestMessage,
        },
      });

      // 5. 구매 항목 생성
      await tx.purchaseItems.create({
        data: {
          purchaseRequestId: newPurchaseRequest.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          priceSnapshot: cartItem.products.price,
        },
      });

      // 6. Cart에서 해당 아이템들 삭제
      await tx.carts.deleteMany({
        where: {
          userId,
          productId,
        },
      });

      return newPurchaseRequest;
    });

    return { data: result };
  },

  // 💰 [Purchase] 구매 관리 대시보드 API
  // 조직 전체 지출액/예산 조회
  // 데이터: 이번달 지출액, 지난달 지출액, 남은 예산, 올해 총 지출액, 지난해 지출액
  // 전체 구매 내역 리스트
  async getPurchaseDashboard(companyId: string, query: GetAllPurchasesQuery) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 0-indexed

    // 이번달 시작일과 종료일
    const thisMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const thisMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // 지난달 시작일과 종료일
    const lastMonthStart = new Date(currentYear, currentMonth - 2, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth - 1, 0, 23, 59, 59, 999);

    // 올해 시작일과 종료일
    const thisYearStart = new Date(currentYear, 0, 1);
    const thisYearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    // 작년 시작일과 종료일
    const lastYearStart = new Date(currentYear - 1, 0, 1);
    const lastYearEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59, 999);

    // 1. 이번달 지출액 (APPROVED 상태만, totalPrice + shippingFee)
    const thisMonthExpenses = await prisma.purchaseRequests.aggregate({
      where: {
        companyId,
        status: 'APPROVED',
        updatedAt: {
          gte: thisMonthStart,
          lte: thisMonthEnd,
        },
      },
      _sum: {
        totalPrice: true,
        shippingFee: true,
      },
    });

    // 2. 지난달 지출액 (APPROVED 상태만, totalPrice + shippingFee)
    const lastMonthExpenses = await prisma.purchaseRequests.aggregate({
      where: {
        companyId,
        status: 'APPROVED',
        updatedAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      _sum: {
        totalPrice: true,
        shippingFee: true,
      },
    });

    // 3. 올해 총 지출액 (APPROVED 상태만, totalPrice + shippingFee)
    const thisYearExpenses = await prisma.purchaseRequests.aggregate({
      where: {
        companyId,
        status: 'APPROVED',
        updatedAt: {
          gte: thisYearStart,
          lte: thisYearEnd,
        },
      },
      _sum: {
        totalPrice: true,
        shippingFee: true,
      },
    });

    // 4. 작년 총 지출액 (APPROVED 상태만, totalPrice + shippingFee)
    const lastYearExpenses = await prisma.purchaseRequests.aggregate({
      where: {
        companyId,
        status: 'APPROVED',
        updatedAt: {
          gte: lastYearStart,
          lte: lastYearEnd,
        },
      },
      _sum: {
        totalPrice: true,
        shippingFee: true,
      },
    });

    // 5. 이번달 예산 조회
    const thisMonthBudget = await prisma.budgets.findUnique({
      where: {
        companyId_year_month: {
          companyId,
          year: currentYear,
          month: currentMonth,
        },
      },
    });

    // 6. Prisma aggregate 결과에서 _sum 추출
    // eslint-disable-next-line no-underscore-dangle
    const thisMonthSum = thisMonthExpenses._sum;
    // eslint-disable-next-line no-underscore-dangle
    const lastMonthSum = lastMonthExpenses._sum;
    // eslint-disable-next-line no-underscore-dangle
    const thisYearSum = thisYearExpenses._sum;
    // eslint-disable-next-line no-underscore-dangle
    const lastYearSum = lastYearExpenses._sum;

    // 7. 남은 예산 계산 (totalPrice + shippingFee를 예산에서 차감)
    const thisMonthTotalExpenses = (thisMonthSum.totalPrice || 0) + (thisMonthSum.shippingFee || 0);
    const remainingBudget = thisMonthBudget
      ? thisMonthBudget.amount - thisMonthTotalExpenses
      : null;

    // 8. 전체 구매 내역 리스트 (페이지네이션)
    const page = query.page || 1;
    const limit = query.limit || 10;
    const sortBy = query.sortBy || 'createdAt';
    const order = query.order || 'desc';
    const skip = (page - 1) * limit;

    const totalItems = await prisma.purchaseRequests.count({
      where: {
        companyId,
        status: 'APPROVED',
      },
    });

    const purchaseList = await prisma.purchaseRequests.findMany({
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        totalPrice: true,
        shippingFee: true,
        status: true,
        purchaseItems: {
          select: {
            quantity: true,
            priceSnapshot: true,
            products: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
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
        status: 'APPROVED',
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
        expenses: {
          thisMonth: (thisMonthSum.totalPrice || 0) + (thisMonthSum.shippingFee || 0),
          lastMonth: (lastMonthSum.totalPrice || 0) + (lastMonthSum.shippingFee || 0),
          thisYear: (thisYearSum.totalPrice || 0) + (thisYearSum.shippingFee || 0),
          lastYear: (lastYearSum.totalPrice || 0) + (lastYearSum.shippingFee || 0),
        },
        budget: {
          thisMonthBudget: thisMonthBudget?.amount || null,
          remainingBudget,
        },
        purchaseList,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    };
  },
};
