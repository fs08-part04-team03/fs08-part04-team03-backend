import { purchaseStatus } from '@prisma/client';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '../../common/database/prisma.client';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import type {
  GetAllPurchasesQuery,
  PurchaseItemRequest,
  RejectPurchaseRequestBody,
} from './purchase.types';
import { ResponseUtil } from '../../common/utils/response.util';
import { s3Client, S3_BUCKET_NAME, PRESIGNED_URL_EXPIRES_IN } from '../../config/s3.config';

// Presigned URL 생성 헬퍼 함수
const getPresignedUrlForProduct = async (imageKey: string | null): Promise<string | null> => {
  if (!imageKey) return null;

  try {
    return await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: imageKey }),
      { expiresIn: PRESIGNED_URL_EXPIRES_IN }
    );
  } catch (error) {
    console.error('Failed to generate presigned URL:', error);
    return null;
  }
};

export const purchaseService = {
  // 💰 [Purchase] 전체 구매 내역 목록 API (관리자)
  async getAllPurchases(companyId: string, query: GetAllPurchasesQuery) {
    // 기본 값 설정
    const page = query.page || 1;
    const limit = query.limit || 6;
    const sortBy = query.sortBy || 'createdAt';
    const order = query.order || 'desc';
    // 건너뛸 항목 수 계산
    const skip = (page - 1) * limit;

    // 전체 개수 조회
    const total = await prisma.purchaseRequests.count({
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

    return ResponseUtil.successWithPagination(
      purchaseList,
      { page, limit, total },
      '전체 구매 내역을 조회했습니다.'
    );
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

    const totalPrice = products.reduce((acc: number, product: { id: number; price: number }) => {
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
          status: purchaseStatus.APPROVED, // 즉시 구매이므로 바로 승인 처리
        },
      });

      // 3. 구매 항목 생성
      const purchaseItemsData = items.map((item) => {
        const product = products.find(
          (p: { id: number; price: number }) => p.id === item.productId
        );
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

    return ResponseUtil.success(result, '즉시 구매가 완료되었습니다.');
  },

  // 💰 [Purchase] 내 구매 내역 조회 API
  async getMyPurchases(companyId: string, userId: string, query: GetAllPurchasesQuery) {
    // 기본 값 설정
    const page = query.page || 1;
    const limit = query.limit || 6;
    const sortBy = query.sortBy || 'createdAt';
    const order = query.order || 'desc';
    // 건너뛸 항목 수 계산
    const skip = (page - 1) * limit;

    // 전체 개수 조회
    const total = await prisma.purchaseRequests.count({
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

    return ResponseUtil.successWithPagination(
      purchaseList,
      { page, limit, total },
      '내 구매 내역을 조회했습니다.'
    );
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
        reason: true, // 승인 사유
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

    // 존재하지 않으면 404 에러 반환
    if (!purchaseDetail) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.PURCHASE_NOT_FOUND,
        '구매 요청을 찾을 수 없습니다.'
      );
    }

    // purchaseItems에 imageUrl 추가
    const purchaseItemsWithUrls = await Promise.all(
      purchaseDetail.purchaseItems.map(async (item) => ({
        ...item,
        products: {
          ...item.products,
          imageUrl: await getPresignedUrlForProduct(item.products.image),
        },
      }))
    );

    return ResponseUtil.success(
      { ...purchaseDetail, purchaseItems: purchaseItemsWithUrls },
      '내 구매 상세 내역을 조회했습니다.'
    );
  },

  // 💰 [Purchase] 구매 요청 상세 조회 API (관리자)
  async getPurchaseRequestDetail(companyId: string, purchaseRequestId: string) {
    // 구매 요청 상세 조회 (관리자는 모든 구매 요청 조회 가능)
    const purchaseDetail = await prisma.purchaseRequests.findFirst({
      where: {
        id: purchaseRequestId,
        companyId,
      },
      select: {
        id: true,
        createdAt: true, // 요청일
        updatedAt: true, // 승인/반려일
        totalPrice: true, // 가격
        shippingFee: true, // 배송비
        status: true, // 상태
        requestMessage: true, // 요청 비고
        reason: true, // 승인 사유
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

    // 존재하지 않으면 404 에러 반환
    if (!purchaseDetail) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.PURCHASE_NOT_FOUND,
        '구매 요청을 찾을 수 없습니다.'
      );
    }

    // approvedAt 계산: status가 APPROVED일 때만 updatedAt 사용
    const approvedAt =
      purchaseDetail.status === purchaseStatus.APPROVED ? purchaseDetail.updatedAt : null;

    // 상품 금액 합계 계산 (배송비 제외)
    const itemsTotalPrice = purchaseDetail.totalPrice;

    // 최종 금액 계산 (상품 + 배송비)
    const finalTotalPrice = purchaseDetail.totalPrice + purchaseDetail.shippingFee;

    // 각 구매 항목에 itemTotal과 imageUrl 추가
    const purchaseItems = await Promise.all(
      purchaseDetail.purchaseItems.map(async (item) => ({
        ...item,
        itemTotal: item.quantity * item.priceSnapshot,
        products: {
          ...item.products,
          imageUrl: await getPresignedUrlForProduct(item.products.image),
        },
      }))
    );

    // 응답 데이터 재구성
    const response = {
      id: purchaseDetail.id,
      createdAt: purchaseDetail.createdAt,
      updatedAt: purchaseDetail.updatedAt,
      approvedAt,
      itemsTotalPrice,
      shippingFee: purchaseDetail.shippingFee,
      finalTotalPrice,
      status: purchaseDetail.status,
      requestMessage: purchaseDetail.requestMessage,
      reason: purchaseDetail.reason,
      rejectReason: purchaseDetail.rejectReason,
      purchaseItems,
      requester: purchaseDetail.requester,
      approver: purchaseDetail.approver,
    };

    return ResponseUtil.success(response, '구매 요청 상세 내역을 조회했습니다.');
  },

  // 💰 [Purchase] 구매 요청 확인 API (관리자)
  async managePurchaseRequests(
    companyId: string,
    query: GetAllPurchasesQuery & { status?: purchaseStatus }
  ) {
    // 기본 값 설정
    const page = query.page || 1;
    const limit = query.limit || 6;
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

    return ResponseUtil.successWithPagination(
      purchaseRequests,
      { page, limit, total: totalItems },
      '구매 요청 목록을 조회했습니다.'
    );
  },

  // 💰 [Purchase] 구매 요청 승인 API (관리자)
  async approvePurchaseRequest(
    companyId: string,
    userId: string,
    message: string | undefined,
    purchaseRequestId: string
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

    if (purchaseRequest.status !== purchaseStatus.PENDING) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '이미 처리된 구매 요청입니다.'
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // status = PENDING 조건까지 포함해서 원자적으로 승인 처리
      const updateResult = await tx.purchaseRequests.updateMany({
        where: {
          id: purchaseRequestId,
          companyId,
          status: purchaseStatus.PENDING,
        },
        data: {
          status: purchaseStatus.APPROVED,
          approverId: userId,
          reason: message,
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

      // updateMany는 업데이트된 레코드를 반환하지 않으므로 다시 조회
      const updatedRequest = await tx.purchaseRequests.findUniqueOrThrow({
        where: { id: purchaseRequestId },
      });

      // 승인된 만큼 예산도 삭감시키기
      const now = new Date();
      const budget = await tx.budgets.findFirst({
        where: {
          companyId,
          year: now.getUTCFullYear(),
          month: now.getUTCMonth() + 1,
        },
      });

      if (!budget) {
        throw new CustomError(
          HttpStatus.BAD_REQUEST,
          ErrorCodes.GENERAL_NOT_FOUND,
          '이번 달 예산을 찾을 수 없습니다.'
        );
      }

      // 예산 부족 시 에러 반환
      if (budget.amount < updatedRequest.totalPrice + updatedRequest.shippingFee) {
        throw new CustomError(
          HttpStatus.BAD_REQUEST,
          ErrorCodes.BUDGET_EXCEEDED,
          '예산이 부족하여 구매 요청을 승인할 수 없습니다.'
        );
      }

      await tx.budgets.update({
        where: {
          companyId_year_month: {
            companyId,
            year: now.getUTCFullYear(),
            month: now.getUTCMonth() + 1,
          },
        },
        data: {
          amount: budget.amount - (updatedRequest.totalPrice + updatedRequest.shippingFee),
        },
      });

      return updatedRequest;
    });

    return ResponseUtil.success(result, '구매 요청을 승인했습니다.');
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

    if (purchaseRequest.status !== purchaseStatus.PENDING) {
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
        status: purchaseStatus.PENDING,
      },
      data: {
        status: purchaseStatus.REJECTED,
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

    const result = await prisma.purchaseRequests.findFirst({
      where: {
        id: purchaseRequestId,
        companyId,
      },
    });

    return ResponseUtil.success(result, '구매 요청을 반려했습니다.');
  },

  // 💰 [Purchase] 구매 요청 API
  async requestPurchase(
    companyId: string,
    userId: string,
    shippingFee: number,
    items: Array<{ productId: number; quantity: number }>,
    requestMessage?: string
  ) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cart 테이블에서 요청한 모든 상품이 있는지 확인
      const cartItems = await tx.carts.findMany({
        where: {
          userId,
          productId: { in: items.map((item) => item.productId) },
        },
        include: {
          products: true,
        },
      });

      // 2. 요청한 모든 상품이 장바구니에 있는지 확인
      if (cartItems.length !== items.length) {
        const foundProductIds = cartItems.map((c: { productId: number }) => c.productId);
        const missingProductIds = items
          .filter((item) => !foundProductIds.includes(item.productId))
          .map((item) => item.productId);
        throw new CustomError(
          HttpStatus.BAD_REQUEST,
          ErrorCodes.PURCHASE_CART_ITEM_NOT_FOUND,
          `상품 ID [${missingProductIds.join(', ')}]가 장바구니에 존재하지 않습니다.`
        );
      }

      // 3. 각 상품의 수량 및 유효성 확인
      const totalPrice = items.reduce((sum: number, item) => {
        const cartItem = cartItems.find(
          (c: { productId: number }) => c.productId === item.productId
        );
        if (!cartItem) return sum;

        // 수량 일치 확인
        if (cartItem.quantity !== item.quantity) {
          throw new CustomError(
            HttpStatus.BAD_REQUEST,
            ErrorCodes.PURCHASE_CART_ITEM_MISMATCH,
            `상품 ID ${item.productId}의 수량이 장바구니와 일치하지 않습니다. (장바구니: ${cartItem.quantity}, 요청: ${item.quantity})`
          );
        }

        // 상품이 활성화되어 있고, 같은 회사의 상품인지 확인
        if (!cartItem.products.isActive || cartItem.products.companyId !== companyId) {
          throw new CustomError(
            HttpStatus.BAD_REQUEST,
            ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
            `상품 ID ${item.productId}는 구매할 수 없는 상품입니다.`
          );
        }

        // 총 가격 누적
        return sum + cartItem.products.price * cartItem.quantity;
      }, 0);

      // 4. 구매 요청 생성
      const newPurchaseRequest = await tx.purchaseRequests.create({
        data: {
          companyId,
          requesterId: userId,
          totalPrice,
          shippingFee,
          status: purchaseStatus.PENDING,
          requestMessage,
        },
      });

      // 5. 구매 항목들 생성
      await tx.purchaseItems.createMany({
        data: cartItems.map(
          (cartItem: { productId: number; quantity: number; products: { price: number } }) => ({
            purchaseRequestId: newPurchaseRequest.id,
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            priceSnapshot: cartItem.products.price,
          })
        ),
      });

      // 6. Cart에서 해당 아이템들 삭제
      await tx.carts.deleteMany({
        where: {
          userId,
          productId: { in: items.map((item) => item.productId) },
        },
      });

      return newPurchaseRequest;
    });

    return ResponseUtil.success(result, '구매 요청이 완료되었습니다.');
  },

  // 💰 [Purchase] 구매 요청 취소 API
  async cancelPurchaseRequest(companyId: string, userId: string, purchaseRequestId: string) {
    // 1. 구매 요청 존재 여부 확인 (회사 및 사용자 범위 포함)
    // - companyId: 같은 회사의 구매 요청인지 확인
    // - requesterId: 본인이 요청한 구매만 취소 가능
    const purchaseRequest = await prisma.purchaseRequests.findFirst({
      where: {
        id: purchaseRequestId,
        companyId,
        requesterId: userId, // 본인 확인 (다른 사용자 요청은 404)
      },
    });

    // 2. 구매 요청이 없으면 404 에러 반환
    // (존재하지 않거나, 다른 사용자의 요청인 경우)
    if (!purchaseRequest) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.PURCHASE_NOT_FOUND,
        '구매 요청을 찾을 수 없습니다.'
      );
    }

    // 3. PENDING 상태가 아니면 취소 불가 (사전 검증)
    // - APPROVED: 이미 승인됨 (취소 불가)
    // - REJECTED: 이미 반려됨 (취소 불가)
    // - CANCELLED: 이미 취소됨 (중복 취소 방지)
    if (purchaseRequest.status !== purchaseStatus.PENDING) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '대기 중인 구매 요청만 취소할 수 있습니다.'
      );
    }

    // 4. status = PENDING 조건까지 포함해서 원자적으로 취소 처리
    // updateMany를 사용하는 이유:
    // - 동시성 제어: 여러 요청이 동시에 처리되어도 안전
    // - 조건부 업데이트: status='PENDING' 조건으로 다른 트랜잭션에서 먼저 처리된 경우 감지
    // - count가 0이면 → 다른 트랜잭션에서 이미 상태 변경됨
    // DELETE가 아닌 UPDATE를 사용하는 이유:
    // - Foreign key constraint 위반 방지 (purchaseItems가 참조 중)
    // - 취소 이력 보존 (감사 추적 가능)
    // - updatedAt 자동 업데이트 (취소 시점 기록)
    const updateResult = await prisma.purchaseRequests.updateMany({
      where: {
        id: purchaseRequestId,
        companyId,
        requesterId: userId,
        status: purchaseStatus.PENDING, // 원자적 조건: PENDING 상태일 때만 업데이트
      },
      data: {
        status: purchaseStatus.CANCELLED,
      },
    });

    // 5. 업데이트된 레코드가 없으면 동시성 문제 발생
    // 다른 트랜잭션에서 먼저 처리하여 PENDING 상태가 아니게 된 경우
    if (updateResult.count === 0) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '이미 처리된 구매 요청입니다.'
      );
    }

    // 6. 취소된 구매 요청 정보 조회 및 반환
    const cancelledRequest = await prisma.purchaseRequests.findFirst({
      where: {
        id: purchaseRequestId,
        companyId,
      },
    });

    return ResponseUtil.success(cancelledRequest, '구매 요청이 취소되었습니다.');
  },

  // 💰 [Purchase] 지출 통계 조회 API
  async getExpenseStatistics(companyId: string) {
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
        status: purchaseStatus.APPROVED,
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
        status: purchaseStatus.APPROVED,
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
        status: purchaseStatus.APPROVED,
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
        status: purchaseStatus.APPROVED,
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

    const data = {
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
    };

    return ResponseUtil.success(data, '지출 통계를 조회했습니다.');
  },

  // 💰 [Purchase] 구매 관리 대시보드 API
  // 조직 전체 지출액/예산 조회
  // 데이터: 이번달 지출액, 총 지출액, 남은 예산, 올해 총 지출액, 지난해 지출액
  // 신규회원 리스트, 탈퇴/권한 변경 회원 리스트, 1달간 요청한 간식 리스트, 매달 지출 내역
  // 전체 구매 내역 리스트
  async getPurchaseDashboard(companyId: string) {
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
        status: purchaseStatus.APPROVED,
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
        status: purchaseStatus.APPROVED,
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
        status: purchaseStatus.APPROVED,
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
        status: purchaseStatus.APPROVED,
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

    // 6. 총 지출액 (전체 기간, APPROVED 상태만)
    const totalExpenses = await prisma.purchaseRequests.aggregate({
      where: {
        companyId,
        status: purchaseStatus.APPROVED,
      },
      _sum: {
        totalPrice: true,
        shippingFee: true,
      },
    });

    // 7. 신규회원 리스트 (이번달 가입한 회원)
    const newUsers = await prisma.users.findMany({
      where: {
        companyId,
        createdAt: {
          gte: thisMonthStart,
          lte: thisMonthEnd,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 8. 탈퇴/권한 변경 회원 리스트 (History 테이블 조회)
    // 먼저 현재 회사의 사용자 ID 목록 조회
    const companyUserIds = await prisma.users.findMany({
      where: { companyId },
      select: { id: true },
    });

    const userChanges = await prisma.history.findMany({
      where: {
        tableName: 'users',
        operationType: {
          in: ['UPDATE', 'DELETE'],
        },
        tableId: {
          in: companyUserIds.map((u) => u.id),
        },
        createdAt: {
          gte: thisMonthStart,
          lte: thisMonthEnd,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // 최근 50개만
    });

    // 9. 이번달 요청한 간식 리스트 (구매 빈도순 순위)
    const monthlySnacks = await prisma.purchaseItems.findMany({
      where: {
        purchaseRequests: {
          companyId,
          status: purchaseStatus.APPROVED,
          createdAt: {
            gte: thisMonthStart,
            lte: thisMonthEnd,
          },
        },
      },
      select: {
        products: {
          select: {
            name: true,
          },
        },
        priceSnapshot: true,
        quantity: true,
      },
    });

    // 간식별로 집계하여 순위 생성
    const snacksMap = new Map<
      string,
      { name: string; price: number; totalQuantity: number; purchaseCount: number }
    >();

    monthlySnacks.forEach((item) => {
      const key = item.products.name;
      if (snacksMap.has(key)) {
        const existing = snacksMap.get(key)!;
        existing.totalQuantity += item.quantity;
        existing.purchaseCount += 1;
      } else {
        snacksMap.set(key, {
          name: item.products.name,
          price: item.priceSnapshot,
          totalQuantity: item.quantity,
          purchaseCount: 1,
        });
      }
    });

    // 구매 횟수 기준으로 정렬하여 순위 부여
    const snacksList = Array.from(snacksMap.values())
      .sort((a, b) => {
        // 구매 횟수로 먼저 정렬, 같으면 총 구매 수량으로 정렬
        if (b.purchaseCount !== a.purchaseCount) {
          return b.purchaseCount - a.purchaseCount;
        }
        return b.totalQuantity - a.totalQuantity;
      })
      .map((item, index) => ({
        rank: index + 1,
        name: item.name,
        price: item.price,
        totalQuantity: item.totalQuantity,
        purchaseCount: item.purchaseCount,
      }));

    // 10. 매달 지출 내역 (최근 12개월)
    const monthlyExpenses = await Promise.all(
      Array.from({ length: 12 }, async (_, i) => {
        const targetDate = new Date(currentYear, currentMonth - 1 - i, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

        const expenses = await prisma.purchaseRequests.aggregate({
          where: {
            companyId,
            status: purchaseStatus.APPROVED,
            updatedAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: {
            totalPrice: true,
            shippingFee: true,
          },
        });

        // eslint-disable-next-line no-underscore-dangle
        const sum = expenses._sum;
        return {
          year,
          month,
          totalExpenses: (sum.totalPrice || 0) + (sum.shippingFee || 0),
        };
      })
    );

    // 11. Prisma aggregate 결과에서 _sum 추출
    // eslint-disable-next-line no-underscore-dangle
    const thisMonthSum = thisMonthExpenses._sum;
    // eslint-disable-next-line no-underscore-dangle
    const lastMonthSum = lastMonthExpenses._sum;
    // eslint-disable-next-line no-underscore-dangle
    const thisYearSum = thisYearExpenses._sum;
    // eslint-disable-next-line no-underscore-dangle
    const lastYearSum = lastYearExpenses._sum;
    // eslint-disable-next-line no-underscore-dangle
    const totalSum = totalExpenses._sum;

    // 12. 남은 예산 계산 (totalPrice + shippingFee를 예산에서 차감)
    const thisMonthTotalExpenses = (thisMonthSum.totalPrice || 0) + (thisMonthSum.shippingFee || 0);
    const remainingBudget = thisMonthBudget
      ? thisMonthBudget.amount - thisMonthTotalExpenses
      : null;

    const data = {
      expenses: {
        thisMonth: (thisMonthSum.totalPrice || 0) + (thisMonthSum.shippingFee || 0),
        lastMonth: (lastMonthSum.totalPrice || 0) + (lastMonthSum.shippingFee || 0),
        thisYear: (thisYearSum.totalPrice || 0) + (thisYearSum.shippingFee || 0),
        lastYear: (lastYearSum.totalPrice || 0) + (lastYearSum.shippingFee || 0),
        total: (totalSum.totalPrice || 0) + (totalSum.shippingFee || 0), // 총 지출액 추가
      },
      budget: {
        thisMonthBudget: thisMonthBudget?.amount || null,
        remainingBudget,
      },
      newUsers, // 신규회원 리스트
      userChanges, // 탈퇴/권한 변경 회원 리스트
      snacksList, // 1달간 요청한 간식 리스트
      monthlyExpenses: monthlyExpenses.reverse(), // 매달 지출 내역 (오래된 순으로 정렬)
    };

    return ResponseUtil.success(data, '구매 관리 대시보드 정보를 조회했습니다.');
  },
};
