import { Prisma } from '@prisma/client';
import { prisma } from '@/common/database/prisma.client';
import { CustomError } from '@/common/utils/error.util';
import { HttpStatus } from '@/common/constants/httpStatus.constants';
import { ErrorCodes } from '@/common/constants/errorCodes.constants';
import { wishlistService } from './wishlist.service';

// Prisma 모킹
jest.mock('@/common/database/prisma.client', () => ({
  prisma: {
    users: {
      findUnique: jest.fn(),
    },
    products: {
      findUnique: jest.fn(),
    },
    wishLists: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('WishlistService', () => {
  const mockUserId = 'user-123';
  const mockCompanyId = 'company-123';
  const mockProductId = 1;

  const mockUser = {
    id: mockUserId,
    companyId: mockCompanyId,
    email: 'test@example.com',
    name: '테스트 유저',
    role: 'USER' as const,
    isActive: true,
    password: 'hashed',
    refreshToken: null,
    profileImage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: mockProductId,
    name: '테스트 상품',
    price: 10000,
    image: 'image.jpg',
    link: 'https://example.com',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    companyId: mockCompanyId,
    description: '테스트 상품입니다',
    category: '간식',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWishlist', () => {
    it('새로운 찜을 등록해야 합니다', async () => {
      // Given
      const mockWishlist = {
        id: 'wishlist-1',
        userId: mockUserId,
        productId: mockProductId,
        createdAt: new Date(),
        products: {
          id: mockProductId,
          name: mockProduct.name,
          price: mockProduct.price,
          image: mockProduct.image,
          link: mockProduct.link,
          isActive: mockProduct.isActive,
          createdAt: mockProduct.createdAt,
        },
      };

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.products.findUnique as jest.Mock).mockResolvedValue({
        id: mockProductId,
        companyId: mockCompanyId,
        isActive: true,
      });
      (prisma.wishLists.create as jest.Mock).mockResolvedValue(mockWishlist);

      // When
      const result = await wishlistService.createWishlist(mockUserId, mockProductId);

      // Then
      expect(result.isNew).toBe(true);
      expect(result.item.id).toBe('wishlist-1');
      expect(result.item.product.id).toBe(mockProductId);
      expect(prisma.wishLists.create).toHaveBeenCalledWith({
        data: { userId: mockUserId, productId: mockProductId },
        include: expect.any(Object),
      });
    });

    it('이미 찜한 상품일 경우 기존 찜을 반환해야 합니다', async () => {
      // Given
      const mockWishlist = {
        id: 'wishlist-1',
        userId: mockUserId,
        productId: mockProductId,
        createdAt: new Date(),
        products: {
          id: mockProductId,
          name: mockProduct.name,
          price: mockProduct.price,
          image: mockProduct.image,
          link: mockProduct.link,
          isActive: mockProduct.isActive,
          createdAt: mockProduct.createdAt,
        },
      };

      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.products.findUnique as jest.Mock).mockResolvedValue({
        id: mockProductId,
        companyId: mockCompanyId,
        isActive: true,
      });
      (prisma.wishLists.create as jest.Mock).mockRejectedValue(prismaError);
      (prisma.wishLists.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockWishlist);

      // When
      const result = await wishlistService.createWishlist(mockUserId, mockProductId);

      // Then
      expect(result.isNew).toBe(false);
      expect(result.item.id).toBe('wishlist-1');
      expect(prisma.wishLists.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { userId_productId: { userId: mockUserId, productId: mockProductId } },
        include: expect.any(Object),
      });
    });

    it('사용자를 찾을 수 없으면 에러를 발생시켜야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(wishlistService.createWishlist(mockUserId, mockProductId)).rejects.toThrow(
        CustomError
      );
      await expect(wishlistService.createWishlist(mockUserId, mockProductId)).rejects.toMatchObject(
        {
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: ErrorCodes.USER_NOT_FOUND,
        }
      );
    });

    it('비활성화된 사용자는 찜을 등록할 수 없어야 합니다', async () => {
      // Given
      const inactiveUser = { ...mockUser, isActive: false };
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(inactiveUser);

      // When & Then
      await expect(wishlistService.createWishlist(mockUserId, mockProductId)).rejects.toThrow(
        CustomError
      );
      await expect(wishlistService.createWishlist(mockUserId, mockProductId)).rejects.toMatchObject(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCodes.AUTH_UNAUTHORIZED,
        }
      );
    });

    it('상품을 찾을 수 없으면 에러를 발생시켜야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.products.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(wishlistService.createWishlist(mockUserId, mockProductId)).rejects.toThrow(
        CustomError
      );
      await expect(wishlistService.createWishlist(mockUserId, mockProductId)).rejects.toMatchObject(
        {
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: ErrorCodes.GENERAL_NOT_FOUND,
        }
      );
    });

    it('비활성화된 상품은 찜할 수 없어야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.products.findUnique as jest.Mock).mockResolvedValue({
        id: mockProductId,
        companyId: mockCompanyId,
        isActive: false,
      });

      // When & Then
      await expect(wishlistService.createWishlist(mockUserId, mockProductId)).rejects.toThrow(
        CustomError
      );
      await expect(wishlistService.createWishlist(mockUserId, mockProductId)).rejects.toMatchObject(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        }
      );
    });

    it('다른 회사의 상품은 찜할 수 없어야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.products.findUnique as jest.Mock).mockResolvedValue({
        id: mockProductId,
        companyId: 'different-company',
        isActive: true,
      });

      // When & Then
      await expect(wishlistService.createWishlist(mockUserId, mockProductId)).rejects.toThrow(
        CustomError
      );
      await expect(wishlistService.createWishlist(mockUserId, mockProductId)).rejects.toMatchObject(
        {
          statusCode: HttpStatus.FORBIDDEN,
          errorCode: ErrorCodes.AUTH_FORBIDDEN,
          message: '다른 회사의 상품입니다.',
        }
      );
    });
  });

  describe('getMyWishlist', () => {
    it('내 찜 목록을 조회해야 합니다', async () => {
      // Given
      const page = 1;
      const limit = 10;
      const mockWishlists = [
        {
          id: 'wishlist-1',
          userId: mockUserId,
          productId: 1,
          createdAt: new Date(),
          products: {
            id: 1,
            name: '상품1',
            price: 10000,
            image: 'image1.jpg',
            link: 'https://example.com/1',
            isActive: true,
            createdAt: new Date(),
          },
        },
        {
          id: 'wishlist-2',
          userId: mockUserId,
          productId: 2,
          createdAt: new Date(),
          products: {
            id: 2,
            name: '상품2',
            price: 20000,
            image: 'image2.jpg',
            link: 'https://example.com/2',
            isActive: true,
            createdAt: new Date(),
          },
        },
      ];

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.wishLists.count as jest.Mock).mockResolvedValue(2);
      (prisma.wishLists.findMany as jest.Mock).mockResolvedValue(mockWishlists);

      // When
      const result = await wishlistService.getMyWishlist(mockUserId, page, limit);

      // Then
      expect(result.items).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
      });
      expect(prisma.wishLists.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: expect.any(Object),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: 0,
        take: 10,
      });
    });

    it('오름차순으로 정렬해야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.wishLists.count as jest.Mock).mockResolvedValue(0);
      (prisma.wishLists.findMany as jest.Mock).mockResolvedValue([]);

      // When
      await wishlistService.getMyWishlist(mockUserId, 1, 10, 'asc');

      // Then
      expect(prisma.wishLists.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: expect.any(Object),
        orderBy: [{ createdAt: 'asc' }, { id: 'desc' }],
        skip: 0,
        take: 10,
      });
    });

    it('빈 찜 목록을 조회해야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.wishLists.count as jest.Mock).mockResolvedValue(0);
      (prisma.wishLists.findMany as jest.Mock).mockResolvedValue([]);

      // When
      const result = await wishlistService.getMyWishlist(mockUserId, 1, 10);

      // Then
      expect(result.items).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('deleteWishlist', () => {
    it('찜을 해제해야 합니다', async () => {
      // Given
      const mockWishlist = {
        id: 'wishlist-1',
        userId: mockUserId,
        productId: mockProductId,
        createdAt: new Date(),
      };

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.wishLists.findUnique as jest.Mock).mockResolvedValue(mockWishlist);
      (prisma.wishLists.delete as jest.Mock).mockResolvedValue(mockWishlist);

      // When
      const result = await wishlistService.deleteWishlist(mockUserId, mockProductId);

      // Then
      expect(result.productId).toBe(mockProductId);
      expect(prisma.wishLists.delete).toHaveBeenCalledWith({
        where: { userId_productId: { userId: mockUserId, productId: mockProductId } },
      });
    });

    it('찜 목록에 없는 상품일 경우 에러를 발생시켜야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.wishLists.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(wishlistService.deleteWishlist(mockUserId, mockProductId)).rejects.toThrow(
        CustomError
      );
      await expect(wishlistService.deleteWishlist(mockUserId, mockProductId)).rejects.toMatchObject(
        {
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: ErrorCodes.GENERAL_NOT_FOUND,
          message: '찜 목록에 없는 상품입니다.',
        }
      );
    });

    it('비활성화된 사용자는 찜을 해제할 수 없어야 합니다', async () => {
      // Given
      const inactiveUser = { ...mockUser, isActive: false };
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(inactiveUser);

      // When & Then
      await expect(wishlistService.deleteWishlist(mockUserId, mockProductId)).rejects.toThrow(
        CustomError
      );
    });
  });
});
