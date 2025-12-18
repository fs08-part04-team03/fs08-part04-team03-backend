import { prisma } from '../../common/database/prisma.client';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { ResponseUtil } from '../../common/utils/response.util';

export const cartService = {
  // 🛒 [Cart] 장바구니에 상품 추가 API
  addToCart: async (userId: string, productId: number, quantity: number) => {
    // 1. 상품 존재 여부 및 활성화 상태 확인
    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
        isActive: true,
        companyId: true,
      },
    });

    if (!product) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        '존재하지 않는 상품입니다.'
      );
    }

    if (!product.isActive) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '비활성화된 상품은 장바구니에 추가할 수 없습니다.'
      );
    }

    // 2. 사용자의 회사 ID 확인
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        '사용자를 찾을 수 없습니다.'
      );
    }

    // 3. 같은 회사의 상품인지 확인
    if (product.companyId !== user.companyId) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '다른 회사의 상품은 장바구니에 추가할 수 없습니다.'
      );
    }

    // 4. 장바구니에 이미 해당 상품이 있는지 확인
    const existingCartItem = await prisma.carts.findFirst({
      where: {
        userId,
        productId,
      },
    });

    let cartItem;

    if (existingCartItem) {
      // 5-1. 이미 존재하는 경우: 수량 증가
      cartItem = await prisma.carts.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + quantity,
        },
        include: {
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              link: true,
              isActive: true,
            },
          },
        },
      });
    } else {
      // 5-2. 새로운 상품인 경우: 새 항목 추가
      cartItem = await prisma.carts.create({
        data: {
          userId,
          productId,
          quantity,
        },
        include: {
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              link: true,
              isActive: true,
            },
          },
        },
      });
    }

    const data = {
      id: cartItem.id,
      quantity: cartItem.quantity,
      updatedAt: cartItem.updatedAt,
      product: {
        id: cartItem.products.id,
        name: cartItem.products.name,
        price: cartItem.products.price,
        image: cartItem.products.image,
        link: cartItem.products.link,
        isActive: cartItem.products.isActive,
      },
      subtotal: cartItem.products.price * cartItem.quantity,
      isNew: !existingCartItem, // 새로 추가된 항목인지 여부
    };

    // 6. 응답 데이터 구성 - isNew에 따라 메시지 동적 변경
    const message = data.isNew
      ? '장바구니에 상품이 추가되었습니다.'
      : '장바구니 상품의 수량이 증가했습니다.';

    return ResponseUtil.success(data, message);
  },

  // 🛒 [Cart] 내 장바구니 조회 API
  getMyCart: async (userId: string, page: number, limit: number) => {
    const offset = (page - 1) * limit;

    // 페이지네이션된 장바구니 아이템 조회
    const cartItems = await prisma.carts.findMany({
      where: { userId },
      skip: offset,
      take: limit,
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            link: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc', // 최근 업데이트 순으로 정렬
      },
    });

    // 전체 장바구니 아이템 수 조회
    const totalItems = await prisma.carts.count({
      where: { userId },
    });

    // 각 아이템에 소계 추가
    const itemsWithSubtotal = cartItems.map((item) => {
      const subtotal = item.products.price * item.quantity;
      return {
        id: item.id,
        quantity: item.quantity,
        updatedAt: item.updatedAt,
        product: {
          id: item.products.id,
          name: item.products.name,
          price: item.products.price,
          image: item.products.image,
          link: item.products.link,
          isActive: item.products.isActive,
          createdAt: item.products.createdAt,
        },
        subtotal, // 아이템별 소계 (가격 × 수량)
      };
    });

    // 현재 페이지의 총 금액 계산
    const currentPageTotalPrice = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0);

    // 전체 장바구니의 총 금액 계산 (모든 페이지 포함)
    const allCartItems = await prisma.carts.findMany({
      where: { userId },
      include: {
        products: {
          select: {
            price: true,
          },
        },
      },
    });

    const totalPrice = allCartItems.reduce(
      (sum, item) => sum + item.products.price * item.quantity,
      0
    );

    // ResponseUtil.successWithPagination 사용
    // 첫 번째 인자는 배열이어야 하므로 itemsWithSubtotal만 전달
    const response = ResponseUtil.successWithPagination(
      itemsWithSubtotal,
      { page, limit, total: totalItems },
      '내 장바구니 조회에 성공했습니다.'
    );

    // summary 정보를 응답에 추가
    return {
      ...response,
      summary: {
        totalItems,
        currentPageItemCount: itemsWithSubtotal.length,
        currentPageTotalPrice,
        totalPrice,
      },
    };
  },

  // 🛒 [Cart] 장바구니 수량 수정 API
  updateQuantity: async (userId: string, cartItemId: string, quantity: number) => {
    // 1. 장바구니 항목 존재 여부 확인
    const cartItem = await prisma.carts.findUnique({
      where: { id: cartItemId },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            link: true,
            isActive: true,
          },
        },
      },
    });

    if (!cartItem || cartItem.userId !== userId) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        '장바구니 항목을 찾을 수 없습니다.'
      );
    }

    // 2. 수량 업데이트
    const updatedCartItem = await prisma.carts.update({
      where: { id: cartItemId },
      data: { quantity },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            link: true,
            isActive: true,
          },
        },
      },
    });

    // 3. 응답 데이터 구성
    const data = {
      id: updatedCartItem.id,
      quantity: updatedCartItem.quantity,
      updatedAt: updatedCartItem.updatedAt,
      product: {
        id: updatedCartItem.products.id,
        name: updatedCartItem.products.name,
        price: updatedCartItem.products.price,
        image: updatedCartItem.products.image,
        link: updatedCartItem.products.link,
        isActive: updatedCartItem.products.isActive,
      },
      subtotal: updatedCartItem.products.price * updatedCartItem.quantity,
    };

    return ResponseUtil.success(data, '장바구니 상품 수량이 수정되었습니다.');
  },

  // 🛒 [Cart] 장바구니 삭제 API
  deleteFromCart: async (userId: string, cartItemId: string) => {
    // 1. 장바구니 항목 존재 여부 확인
    const cartItem = await prisma.carts.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem || cartItem.userId !== userId) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        '장바구니 항목을 찾을 수 없습니다.'
      );
    }

    // 2. 장바구니 항목 삭제
    await prisma.carts.delete({
      where: { id: cartItemId },
    });

    return ResponseUtil.success({ id: cartItemId }, '장바구니에서 상품이 삭제되었습니다.');
  },

  // 🛒 [Cart] 장바구니 다중 삭제 API
  deleteMultipleFromCart: async (userId: string, cartItemIds: string[]) => {
    // 1. 빈 배열 체크
    if (!cartItemIds || cartItemIds.length === 0) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '삭제할 장바구니 항목을 선택해주세요.'
      );
    }

    // 2. 장바구니 항목들 존재 여부 및 소유권 확인
    const cartItems = await prisma.carts.findMany({
      where: {
        id: { in: cartItemIds },
        userId,
      },
    });

    // 3. 요청된 ID와 실제 찾은 항목 수 비교
    if (cartItems.length !== cartItemIds.length) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_NOT_FOUND,
        '일부 장바구니 항목을 찾을 수 없거나 권한이 없습니다.'
      );
    }

    // 4. 트랜잭션으로 일괄 삭제
    const deletedCount = await prisma.carts.deleteMany({
      where: {
        id: { in: cartItemIds },
        userId,
      },
    });

    return ResponseUtil.success(
      {
        deletedCount: deletedCount.count,
        deletedIds: cartItemIds,
      },
      `${deletedCount.count}개의 상품이 장바구니에서 삭제되었습니다.`
    );
  },
};
