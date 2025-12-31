import type { Prisma } from '@prisma/client';
import { prisma } from '../../common/database/prisma.client';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';

type WishlistSort = 'asc' | 'desc';

// 상품 선택 필드
const productSelect = {
  id: true,
  name: true,
  price: true,
  image: true,
  link: true,
  isActive: true,
  createdAt: true,
};

// 찜 목록 행 타입
type WishlistRow = Prisma.wishListsGetPayload<{
  include: { products: { select: typeof productSelect } };
}>;

// 찜 목록 아이템 타입
type WishlistItem = {
  id: string;
  createdAt: Date;
  product: {
    id: number;
    name: string;
    price: number;
    image: string | null;
    link: string;
    isActive: boolean;
    createdAt: Date;
  };
};

// 찜 목록 아이템 변환 함수
function toWishlistItem(row: WishlistRow): WishlistItem {
  return {
    id: row.id,
    createdAt: row.createdAt,
    product: row.products,
  };
}

// 사용자 조회 및 활성 상태 확인
async function getUser(userId: string) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) {
    throw new CustomError(
      HttpStatus.NOT_FOUND,
      ErrorCodes.USER_NOT_FOUND,
      '사용자를 찾을 수 없습니다.'
    );
  }
  return user;
}

// 활성 사용자 확인 함수
async function ensureActiveUser(userId: string) {
  const user = await getUser(userId);
  if (!user.isActive) {
    throw new CustomError(
      HttpStatus.UNAUTHORIZED,
      ErrorCodes.AUTH_UNAUTHORIZED,
      '비활성화된 계정입니다.'
    );
  }
  return user;
}

// 활성 상품 확인 함수
async function getActiveProduct(productId: number) {
  const product = await prisma.products.findUnique({
    where: { id: productId },
    select: { id: true, companyId: true, isActive: true },
  });

  if (!product) {
    throw new CustomError(
      HttpStatus.NOT_FOUND,
      ErrorCodes.GENERAL_NOT_FOUND,
      '상품을 찾을 수 없습니다.'
    );
  }
  if (!product.isActive) {
    throw new CustomError(
      HttpStatus.BAD_REQUEST,
      ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
      '비활성화된 상품입니다.'
    );
  }
  return product;
}

export const wishlistService = {
  // 찜 등록
  async createWishlist(userId: string, productId: number) {
    const user = await ensureActiveUser(userId);
    const product = await getActiveProduct(productId);

    if (product.companyId !== user.companyId) {
      throw new CustomError(
        HttpStatus.FORBIDDEN,
        ErrorCodes.AUTH_FORBIDDEN,
        '다른 회사의 상품입니다.'
      );
    }

    const existing = await prisma.wishLists.findUnique({
      where: { userId_productId: { userId, productId } },
      include: { products: { select: productSelect } },
    });

    if (existing) {
      return { item: toWishlistItem(existing), isNew: false };
    }

    const created = await prisma.wishLists.create({
      data: { userId, productId },
      include: { products: { select: productSelect } },
    });

    return { item: toWishlistItem(created), isNew: true };
  },

  // 내 찜 목록 조회
  async getMyWishlist(userId: string, page = 1, limit = 10, sort: WishlistSort = 'desc') {
    await ensureActiveUser(userId);

    const orderBy: Prisma.wishListsOrderByWithRelationInput[] = [
      { createdAt: sort },
      { id: 'desc' },
    ];

    const [total, rows] = await Promise.all([
      prisma.wishLists.count({ where: { userId } }),
      prisma.wishLists.findMany({
        where: { userId },
        include: { products: { select: productSelect } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: rows.map(toWishlistItem),
      pagination: { page, limit, total },
    };
  },

  // 찜 해제
  async deleteWishlist(userId: string, productId: number) {
    await ensureActiveUser(userId);

    const existing = await prisma.wishLists.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (!existing) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        '찜 목록에 없는 상품입니다.'
      );
    }

    await prisma.wishLists.delete({
      where: { userId_productId: { userId, productId } },
    });

    return { productId };
  },
};
