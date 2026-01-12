import { Prisma } from '@prisma/client';
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

export const wishlistService = {
  // 찜 등록
  async createWishlist(userId: string, productId: number) {
    return prisma.$transaction(async (tx) => {
      // 1. 사용자 검증
      const user = await tx.users.findUnique({ where: { id: userId } });
      if (!user) {
        throw new CustomError(
          HttpStatus.NOT_FOUND,
          ErrorCodes.USER_NOT_FOUND,
          '사용자를 찾을 수 없습니다.'
        );
      }
      if (!user.isActive) {
        throw new CustomError(
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTH_UNAUTHORIZED,
          '비활성화된 계정입니다.'
        );
      }

      // 2. 상품 검증 (테넌트 격리)
      const product = await tx.products.findFirst({
        where: {
          id: productId,
          companyId: user.companyId, // 같은 회사의 상품만 조회
        },
        select: { id: true, companyId: true, isActive: true },
      });

      if (!product) {
        throw new CustomError(
          HttpStatus.NOT_FOUND,
          ErrorCodes.GENERAL_NOT_FOUND,
          '상품을 찾을 수 없거나 접근 권한이 없습니다.'
        );
      }
      if (!product.isActive) {
        throw new CustomError(
          HttpStatus.BAD_REQUEST,
          ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
          '비활성화된 상품입니다.'
        );
      }

      // 3. 찜 등록 (중복 처리)
      try {
        const created = await tx.wishLists.create({
          data: { userId, productId },
          include: { products: { select: productSelect } },
        });
        return { item: toWishlistItem(created), isNew: true };
      } catch (error) {
        // Unique constraint violation - fetch existing
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          const existing = await tx.wishLists.findUniqueOrThrow({
            where: { userId_productId: { userId, productId } },
            include: { products: { select: productSelect } },
          });
          return { item: toWishlistItem(existing), isNew: false };
        }
        throw error;
      }
    });
  },

  // 내 찜 목록 조회
  async getMyWishlist(userId: string, page = 1, limit = 10, sort: WishlistSort = 'desc') {
    return prisma.$transaction(async (tx) => {
      // 1. 사용자 검증
      const user = await tx.users.findUnique({ where: { id: userId } });
      if (!user) {
        throw new CustomError(
          HttpStatus.NOT_FOUND,
          ErrorCodes.USER_NOT_FOUND,
          '사용자를 찾을 수 없습니다.'
        );
      }
      if (!user.isActive) {
        throw new CustomError(
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTH_UNAUTHORIZED,
          '비활성화된 계정입니다.'
        );
      }

      // 2. 찜 목록 조회 (트랜잭션 내에서 일관된 데이터 보장)
      const orderBy: Prisma.wishListsOrderByWithRelationInput[] = [
        { createdAt: sort },
        { id: 'desc' },
      ];

      const [total, rows] = await Promise.all([
        tx.wishLists.count({ where: { userId } }),
        tx.wishLists.findMany({
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
    });
  },

  // 찜 해제
  async deleteWishlist(userId: string, productId: number) {
    return prisma.$transaction(async (tx) => {
      // 1. 사용자 검증
      const user = await tx.users.findUnique({ where: { id: userId } });
      if (!user) {
        throw new CustomError(
          HttpStatus.NOT_FOUND,
          ErrorCodes.USER_NOT_FOUND,
          '사용자를 찾을 수 없습니다.'
        );
      }
      if (!user.isActive) {
        throw new CustomError(
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTH_UNAUTHORIZED,
          '비활성화된 계정입니다.'
        );
      }

      // 2. 찜 목록 존재 확인 및 삭제 (원자적 처리)
      const existing = await tx.wishLists.findUnique({
        where: { userId_productId: { userId, productId } },
      });

      if (!existing) {
        throw new CustomError(
          HttpStatus.NOT_FOUND,
          ErrorCodes.GENERAL_NOT_FOUND,
          '찜 목록에 없는 상품입니다.'
        );
      }

      await tx.wishLists.delete({
        where: { userId_productId: { userId, productId } },
      });

      return { productId };
    });
  },
};
