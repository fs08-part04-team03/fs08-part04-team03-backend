import { prisma } from '@/common/database/prisma.client';
import { CustomError } from '@/common/utils/error.util';
import { HttpStatus } from '@/common/constants/httpStatus.constants';
import { ErrorCodes } from '@/common/constants/errorCodes.constants';
import { cartService } from './cart.service';

// Prisma 모킹
jest.mock('@/common/database/prisma.client', () => {
  const mockUsersFind = jest.fn();
  const mockProductsFind = jest.fn();
  const mockProductsFindFirst = jest.fn();
  const mockCartsFind = jest.fn();
  const mockCartsCreate = jest.fn();
  const mockCartsUpdate = jest.fn();
  const mockCartsDelete = jest.fn();
  const mockCartsDeleteMany = jest.fn();
  const mockCartsFindMany = jest.fn();
  const mockCartsCount = jest.fn();

  return {
    prisma: {
      $transaction: (callback: (tx: unknown) => unknown) =>
        callback({
          users: {
            findUnique: mockUsersFind,
          },
          products: {
            findFirst: mockProductsFindFirst,
          },
          carts: {
            findFirst: mockCartsFind,
            findMany: mockCartsFindMany,
            findUnique: mockCartsFind,
            create: mockCartsCreate,
            update: mockCartsUpdate,
            delete: mockCartsDelete,
            deleteMany: mockCartsDeleteMany,
            count: mockCartsCount,
          },
        }),
      products: {
        findUnique: mockProductsFind,
        findFirst: mockProductsFindFirst,
      },
      users: {
        findUnique: mockUsersFind,
      },
      carts: {
        findFirst: mockCartsFind,
        findMany: mockCartsFindMany,
        findUnique: mockCartsFind,
        create: mockCartsCreate,
        update: mockCartsUpdate,
        delete: mockCartsDelete,
        deleteMany: mockCartsDeleteMany,
        count: mockCartsCount,
      },
    },
  };
});

describe('CartService', () => {
  const productSelect = {
    id: true,
    name: true,
    price: true,
    image: true,
    link: true,
    isActive: true,
  };
  const mockUserId = 'user-123';
  const mockCompanyId = 'company-123';
  const mockProductId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addToCart', () => {
    const mockProduct = {
      id: mockProductId,
      name: '테스트 상품',
      price: 10000,
      isActive: true,
      companyId: mockCompanyId,
      image: 'image.jpg',
      link: 'https://example.com',
      createdAt: new Date(),
    };

    const mockUser = {
      id: mockUserId,
      companyId: mockCompanyId,
      email: 'test@example.com',
      name: '테스트 유저',
    };

    it('새로운 상품을 장바구니에 추가해야 합니다', async () => {
      // Given
      const quantity = 2;
      const mockCartItem = {
        id: 'cart-1',
        userId: mockUserId,
        productId: mockProductId,
        quantity,
        updatedAt: new Date(),
        products: mockProduct,
      };

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.products.findFirst as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.carts.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.carts.create as jest.Mock).mockResolvedValue(mockCartItem);

      // When
      const result = await cartService.addToCart(mockUserId, mockProductId, quantity);

      // Then
      expect(result.data).toBeDefined();
      expect(result.message).toBe('장바구니에 상품이 추가되었습니다.');
      expect(prisma.carts.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          productId: mockProductId,
          quantity,
        },
        include: {
          products: {
            select: productSelect,
          },
        },
      });
    });

    it('기존 상품의 수량을 증가시켜야 합니다', async () => {
      // Given
      const quantity = 2;
      const existingQuantity = 3;
      const existingCartItem = {
        id: 'cart-1',
        userId: mockUserId,
        productId: mockProductId,
        quantity: existingQuantity,
        updatedAt: new Date(),
      };

      const updatedCartItem = {
        ...existingCartItem,
        quantity: existingQuantity + quantity,
        products: mockProduct,
      };

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.products.findFirst as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.carts.findFirst as jest.Mock).mockResolvedValue(existingCartItem);
      (prisma.carts.update as jest.Mock).mockResolvedValue(updatedCartItem);

      // When
      const result = await cartService.addToCart(mockUserId, mockProductId, quantity);

      // Then
      expect(result.data).toBeDefined();
      expect(result.message).toBe('장바구니 상품의 수량이 증가했습니다.');
      expect(prisma.carts.update).toHaveBeenCalledWith({
        where: { id: existingCartItem.id },
        data: { quantity: existingQuantity + quantity },
        include: {
          products: {
            select: productSelect,
          },
        },
      });
    });

    it('존재하지 않는 상품일 경우 에러를 발생시켜야 합니다', async () => {
      // Given
      (prisma.products.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(cartService.addToCart(mockUserId, mockProductId, 1)).rejects.toThrow(
        CustomError
      );
      await expect(cartService.addToCart(mockUserId, mockProductId, 1)).rejects.toMatchObject({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCodes.GENERAL_NOT_FOUND,
      });
    });

    it('비활성화된 상품일 경우 에러를 발생시켜야 합니다', async () => {
      // Given
      const inactiveProduct = { ...mockProduct, isActive: false };
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.products.findFirst as jest.Mock).mockResolvedValue(inactiveProduct);

      // When & Then
      await expect(cartService.addToCart(mockUserId, mockProductId, 1)).rejects.toThrow(
        CustomError
      );
      await expect(cartService.addToCart(mockUserId, mockProductId, 1)).rejects.toMatchObject({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
      });
    });

    it('사용자를 찾을 수 없을 경우 에러를 발생시켜야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(cartService.addToCart(mockUserId, mockProductId, 1)).rejects.toThrow(
        CustomError
      );
      await expect(cartService.addToCart(mockUserId, mockProductId, 1)).rejects.toMatchObject({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCodes.GENERAL_NOT_FOUND,
        message: '사용자를 찾을 수 없습니다.',
      });
    });

    it('회사에 소속되지 않은 사용자일 경우 에러를 발생시켜야 합니다', async () => {
      // Given
      const userWithoutCompany = { ...mockUser, companyId: null };
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(userWithoutCompany);

      // When & Then
      await expect(cartService.addToCart(mockUserId, mockProductId, 1)).rejects.toThrow(
        CustomError
      );
      await expect(cartService.addToCart(mockUserId, mockProductId, 1)).rejects.toMatchObject({
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: ErrorCodes.AUTH_FORBIDDEN,
        message: '회사에 소속된 사용자만 장바구니를 사용할 수 있습니다.',
      });
    });

    it('다른 회사의 상품일 경우 에러를 발생시켜야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.products.findFirst as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(cartService.addToCart(mockUserId, mockProductId, 1)).rejects.toThrow(
        CustomError
      );
      await expect(cartService.addToCart(mockUserId, mockProductId, 1)).rejects.toMatchObject({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCodes.GENERAL_NOT_FOUND,
      });
    });
  });

  describe('getMyCart', () => {
    const mockProduct = {
      id: 1,
      name: '상품1',
      price: 10000,
      image: 'image1.jpg',
      link: 'https://example.com/1',
      isActive: true,
      createdAt: new Date(),
    };

    it('내 장바구니를 조회해야 합니다', async () => {
      // Given
      const page = 1;
      const limit = 10;
      const mockCartItems = [
        {
          id: 'cart-1',
          quantity: 2,
          updatedAt: new Date(),
          products: mockProduct,
        },
        {
          id: 'cart-2',
          quantity: 3,
          updatedAt: new Date(),
          products: { ...mockProduct, id: 2, name: '상품2', price: 20000 },
        },
      ];

      (prisma.carts.findMany as jest.Mock)
        .mockResolvedValueOnce(mockCartItems) // 첫 번째 호출 (페이지네이션)
        .mockResolvedValueOnce(mockCartItems); // 두 번째 호출 (전체 총액 계산)
      (prisma.carts.count as jest.Mock).mockResolvedValue(2);

      // When
      const result = await cartService.getMyCart(mockUserId, page, limit);

      // Then
      expect(result.summary.totalItems).toBe(2);
      expect(result.summary.currentPageItemCount).toBe(2);
      expect(result.summary.currentPageTotalPrice).toBe(80000); // (10000*2) + (20000*3)
      expect(result.summary.totalPrice).toBe(80000);
    });

    it('빈 장바구니를 조회해야 합니다', async () => {
      // Given
      const page = 1;
      const limit = 10;

      (prisma.carts.findMany as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      (prisma.carts.count as jest.Mock).mockResolvedValue(0);

      // When
      const result = await cartService.getMyCart(mockUserId, page, limit);

      // Then
      expect(result.summary.totalItems).toBe(0);
      expect(result.summary.currentPageItemCount).toBe(0);
      expect(result.summary.totalPrice).toBe(0);
    });
  });

  describe('updateQuantity', () => {
    const mockCartItemId = 'cart-1';
    const mockProduct = {
      id: 1,
      name: '상품1',
      price: 10000,
      image: 'image1.jpg',
      link: 'https://example.com/1',
      isActive: true,
      companyId: mockCompanyId,
    };

    const mockUser = {
      id: mockUserId,
      companyId: mockCompanyId,
      email: 'test@example.com',
      name: '테스트 유저',
    };

    it('장바구니 수량을 수정해야 합니다', async () => {
      // Given
      const newQuantity = 5;
      const mockCartItem = {
        id: mockCartItemId,
        userId: mockUserId,
        productId: 1,
        quantity: 3,
        products: mockProduct,
      };

      const updatedCartItem = {
        ...mockCartItem,
        quantity: newQuantity,
        updatedAt: new Date(),
      };

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.carts.findUnique as jest.Mock).mockResolvedValue(mockCartItem);
      (prisma.carts.update as jest.Mock).mockResolvedValue({
        ...updatedCartItem,
        products: mockProduct,
      });

      // When
      const result = await cartService.updateQuantity(mockUserId, mockCartItemId, newQuantity);

      // Then
      expect(result.data).toBeDefined();
      expect(result.message).toBe('장바구니 상품 수량이 수정되었습니다.');
      expect(prisma.carts.update).toHaveBeenCalledWith({
        where: { id: mockCartItemId },
        data: { quantity: newQuantity },
        include: {
          products: {
            select: productSelect,
          },
        },
      });
    });

    it('존재하지 않는 장바구니 항목일 경우 에러를 발생시켜야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.carts.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(cartService.updateQuantity(mockUserId, mockCartItemId, 5)).rejects.toThrow(
        CustomError
      );
      await expect(cartService.updateQuantity(mockUserId, mockCartItemId, 5)).rejects.toMatchObject(
        {
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: ErrorCodes.GENERAL_NOT_FOUND,
        }
      );
    });

    it('다른 사용자의 장바구니 항목일 경우 에러를 발생시켜야 합니다', async () => {
      // Given
      const mockCartItem = {
        id: mockCartItemId,
        userId: 'different-user',
        productId: 1,
        quantity: 3,
        products: mockProduct,
      };

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.carts.findUnique as jest.Mock).mockResolvedValue(mockCartItem);

      // When & Then
      await expect(cartService.updateQuantity(mockUserId, mockCartItemId, 5)).rejects.toThrow(
        CustomError
      );
    });
  });

  describe('deleteFromCart', () => {
    const mockCartItemId = 'cart-1';
    const mockUser = {
      id: mockUserId,
      companyId: mockCompanyId,
    };

    it('장바구니 항목을 삭제해야 합니다', async () => {
      // Given
      const mockCartItem = {
        id: mockCartItemId,
        userId: mockUserId,
        productId: 1,
        quantity: 3,
        updatedAt: new Date(),
        products: {
          companyId: mockCompanyId,
        },
      };

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.carts.findUnique as jest.Mock).mockResolvedValue(mockCartItem);
      (prisma.carts.delete as jest.Mock).mockResolvedValue(mockCartItem);

      // When
      const result = await cartService.deleteFromCart(mockUserId, mockCartItemId);

      // Then
      expect(result.data).toBeDefined();
      expect(result.message).toBe('장바구니에서 상품이 삭제되었습니다.');
      expect(prisma.carts.delete).toHaveBeenCalledWith({
        where: { id: mockCartItemId },
      });
    });

    it('존재하지 않는 장바구니 항목일 경우 에러를 발생시켜야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.carts.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(cartService.deleteFromCart(mockUserId, mockCartItemId)).rejects.toThrow(
        CustomError
      );
    });

    it('다른 사용자의 장바구니 항목일 경우 에러를 발생시켜야 합니다', async () => {
      // Given
      const mockCartItem = {
        id: mockCartItemId,
        userId: 'different-user',
        productId: 1,
        quantity: 3,
        updatedAt: new Date(),
        products: {
          companyId: mockCompanyId,
        },
      };

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.carts.findUnique as jest.Mock).mockResolvedValue(mockCartItem);

      // When & Then
      await expect(cartService.deleteFromCart(mockUserId, mockCartItemId)).rejects.toThrow(
        CustomError
      );
    });
  });

  describe('deleteMultipleFromCart', () => {
    const mockUser = {
      id: mockUserId,
      companyId: mockCompanyId,
    };

    it('여러 장바구니 항목을 삭제해야 합니다', async () => {
      // Given
      const cartItemIds = ['cart-1', 'cart-2', 'cart-3'];
      const mockCartItems = cartItemIds.map((id) => ({
        id,
        userId: mockUserId,
        productId: 1,
        quantity: 1,
        updatedAt: new Date(),
        products: {
          companyId: mockCompanyId,
        },
      }));

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.carts.findMany as jest.Mock).mockResolvedValue(mockCartItems);
      (prisma.carts.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      // When
      const result = await cartService.deleteMultipleFromCart(mockUserId, cartItemIds);

      // Then
      expect(result.data).toBeDefined();
      expect(result.message).toContain('3개의 상품이 장바구니에서 삭제되었습니다.');
      expect(prisma.carts.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: cartItemIds },
          userId: mockUserId,
        },
      });
    });

    it('빈 배열일 경우 에러를 발생시켜야 합니다', async () => {
      // Given
      const cartItemIds: string[] = [];

      // When & Then
      await expect(cartService.deleteMultipleFromCart(mockUserId, cartItemIds)).rejects.toThrow(
        CustomError
      );
      await expect(
        cartService.deleteMultipleFromCart(mockUserId, cartItemIds)
      ).rejects.toMatchObject({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
      });
    });

    it('일부 항목을 찾을 수 없을 경우 에러를 발생시켜야 합니다', async () => {
      // Given
      const cartItemIds = ['cart-1', 'cart-2', 'cart-3'];
      const mockCartItems = [
        {
          id: 'cart-1',
          userId: mockUserId,
          productId: 1,
          quantity: 1,
          updatedAt: new Date(),
          products: {
            companyId: mockCompanyId,
          },
        },
        {
          id: 'cart-2',
          userId: mockUserId,
          productId: 2,
          quantity: 1,
          updatedAt: new Date(),
          products: {
            companyId: mockCompanyId,
          },
        },
      ]; // cart-3 누락

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.carts.findMany as jest.Mock).mockResolvedValue(mockCartItems);

      // When & Then
      await expect(cartService.deleteMultipleFromCart(mockUserId, cartItemIds)).rejects.toThrow(
        CustomError
      );
      await expect(
        cartService.deleteMultipleFromCart(mockUserId, cartItemIds)
      ).rejects.toMatchObject({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCodes.GENERAL_BAD_REQUEST,
      });
    });
  });
});
