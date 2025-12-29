import { prisma } from '@/common/database/prisma.client';
import { CustomError } from '@/common/utils/error.util';
import { productService } from './product.service';

// Prisma 모킹
jest.mock('@/common/database/prisma.client', () => ({
  prisma: {
    products: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    categoies: {
      findUnique: jest.fn(),
    },
    purchaseItems: {
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

describe('ProductService', () => {
  const mockCompanyId = 'company-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    const validCreateInput = {
      categoryId: 1,
      name: '테스트 상품',
      price: 10000,
      image: 'https://example.com/image.jpg',
      link: 'https://example.com/product',
    };

    const mockCategory = {
      id: 1,
    };

    const mockProduct = {
      id: 1,
      categoryId: 1,
      name: '테스트 상품',
      price: 10000,
      image: 'https://example.com/image.jpg',
      link: 'https://example.com/product',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('정상적으로 상품을 생성해야 합니다', async () => {
      // Given
      (prisma.categoies.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.products.create as jest.Mock).mockResolvedValue(mockProduct);

      // When
      const result = await productService.createProduct(mockCompanyId, validCreateInput);

      // Then
      expect(result).toEqual(mockProduct);
      expect(prisma.categoies.findUnique).toHaveBeenCalledWith({
        where: { id: validCreateInput.categoryId },
        select: { id: true },
      });
      expect(prisma.products.create).toHaveBeenCalledWith({
        data: {
          companyId: mockCompanyId,
          categoryId: validCreateInput.categoryId,
          name: validCreateInput.name,
          price: validCreateInput.price,
          image: validCreateInput.image,
          link: validCreateInput.link,
          isActive: true,
        },
        select: expect.any(Object),
      });
    });

    it('존재하지 않는 카테고리면 에러를 던져야 합니다', async () => {
      // Given
      (prisma.categoies.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(productService.createProduct(mockCompanyId, validCreateInput)).rejects.toThrow(
        CustomError
      );
    });
  });

  describe('getProducts', () => {
    const mockProducts = [
      {
        id: 1,
        categoryId: 1,
        name: '상품 1',
        price: 10000,
        image: 'image1.jpg',
        link: 'link1',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 2,
        categoryId: 1,
        name: '상품 2',
        price: 20000,
        image: 'image2.jpg',
        link: 'link2',
        isActive: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ];

    it('페이징과 함께 상품 목록을 반환해야 합니다', async () => {
      // Given
      const query = { page: 1, limit: 10 };
      (prisma.products.count as jest.Mock).mockResolvedValue(2);
      (prisma.products.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.purchaseItems.groupBy as jest.Mock).mockResolvedValue([]);

      // When
      const result = await productService.getProducts(mockCompanyId, query);

      // Then
      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(result).toHaveProperty('total', 2);
      expect(result.products.length).toBe(2);
      expect(result.products[0]).toHaveProperty('salesCount', 0);
    });

    it('카테고리 필터가 적용되어야 합니다', async () => {
      // Given
      const query = { page: 1, limit: 10, categoryId: 1 };
      (prisma.products.count as jest.Mock).mockResolvedValue(1);
      (prisma.products.findMany as jest.Mock).mockResolvedValue([mockProducts[0]]);
      (prisma.purchaseItems.groupBy as jest.Mock).mockResolvedValue([]);

      // When
      await productService.getProducts(mockCompanyId, query);

      // Then
      expect(prisma.products.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 1,
          }),
        })
      );
    });

    it('상품이 없으면 빈 배열을 반환해야 합니다', async () => {
      // Given
      const query = { page: 1, limit: 10 };
      (prisma.products.count as jest.Mock).mockResolvedValue(0);

      // When
      const result = await productService.getProducts(mockCompanyId, query);

      // Then
      expect(result.products).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('가격 오름차순 정렬이 적용되어야 합니다', async () => {
      // Given
      const query = { page: 1, limit: 10, sort: 'priceAsc' as const };
      (prisma.products.count as jest.Mock).mockResolvedValue(2);
      (prisma.products.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.purchaseItems.groupBy as jest.Mock).mockResolvedValue([]);

      // When
      await productService.getProducts(mockCompanyId, query);

      // Then
      expect(prisma.products.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ price: 'asc' }, { id: 'desc' }],
        })
      );
    });

    it('판매량 정렬이 적용되어야 합니다', async () => {
      // Given
      const query = { page: 1, limit: 10, sort: 'sales' as const };
      (prisma.products.count as jest.Mock).mockResolvedValue(2);
      (prisma.products.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.purchaseItems.groupBy as jest.Mock).mockResolvedValue([
        { productId: 1, _sum: { quantity: 10 } },
        { productId: 2, _sum: { quantity: 5 } },
      ]);

      // When
      const result = await productService.getProducts(mockCompanyId, query);

      // Then
      expect(result.products[0]?.id).toBe(1); // 판매량이 많은 상품이 먼저
      expect(result.products[0]?.salesCount).toBe(10);
      expect(result.products[1]?.salesCount).toBe(5);
    });
  });

  describe('getProductDetail', () => {
    const mockProduct = {
      id: 1,
      categoryId: 1,
      name: '테스트 상품',
      price: 10000,
      image: 'image.jpg',
      link: 'link',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('상품 상세 정보를 반환해야 합니다', async () => {
      // Given
      (prisma.products.findFirst as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.purchaseItems.aggregate as jest.Mock).mockResolvedValue({
        _sum: { quantity: 15 },
      });

      // When
      const result = await productService.getProductDetail(mockCompanyId, 1);

      // Then
      expect(result).toEqual({
        ...mockProduct,
        salesCount: 15,
      });
    });

    it('상품이 없으면 에러를 던져야 합니다', async () => {
      // Given
      (prisma.products.findFirst as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(productService.getProductDetail(mockCompanyId, 999)).rejects.toThrow(
        CustomError
      );
    });

    it('판매 이력이 없으면 salesCount가 0이어야 합니다', async () => {
      // Given
      (prisma.products.findFirst as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.purchaseItems.aggregate as jest.Mock).mockResolvedValue({
        _sum: { quantity: null },
      });

      // When
      const result = await productService.getProductDetail(mockCompanyId, 1);

      // Then
      expect(result.salesCount).toBe(0);
    });
  });

  describe('updateProduct', () => {
    const mockProduct = {
      id: 1,
      categoryId: 1,
      name: '테스트 상품',
      price: 10000,
      image: 'image.jpg',
      link: 'link',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatePayload = {
      name: '수정된 상품명',
      price: 15000,
    };

    it('정상적으로 상품을 수정해야 합니다', async () => {
      // Given
      (prisma.products.findFirst as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.products.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        ...updatePayload,
      });

      // When
      const result = await productService.updateProduct(mockCompanyId, 1, updatePayload);

      // Then
      expect(result.name).toBe(updatePayload.name);
      expect(result.price).toBe(updatePayload.price);
    });

    it('존재하지 않는 상품이면 에러를 던져야 합니다', async () => {
      // Given
      (prisma.products.findFirst as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(productService.updateProduct(mockCompanyId, 999, updatePayload)).rejects.toThrow(
        CustomError
      );
    });

    it('카테고리 변경 시 카테고리 존재 여부를 확인해야 합니다', async () => {
      // Given
      const payloadWithCategory = { ...updatePayload, categoryId: 2 };
      (prisma.products.findFirst as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.categoies.findUnique as jest.Mock).mockResolvedValue({ id: 2 });
      (prisma.products.update as jest.Mock).mockResolvedValue(mockProduct);

      // When
      await productService.updateProduct(mockCompanyId, 1, payloadWithCategory);

      // Then
      expect(prisma.categoies.findUnique).toHaveBeenCalledWith({
        where: { id: 2 },
        select: { id: true },
      });
    });

    it('존재하지 않는 카테고리로 변경하면 에러를 던져야 합니다', async () => {
      // Given
      const payloadWithCategory = { ...updatePayload, categoryId: 999 };
      (prisma.products.findFirst as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.categoies.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(
        productService.updateProduct(mockCompanyId, 1, payloadWithCategory)
      ).rejects.toThrow(CustomError);
    });
  });

  describe('deleteProduct', () => {
    const mockProduct = {
      id: 1,
    };

    it('정상적으로 상품을 논리 삭제해야 합니다', async () => {
      // Given
      (prisma.products.findFirst as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.products.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });

      // When
      const result = await productService.deleteProduct(mockCompanyId, 1);

      // Then
      expect(result.isActive).toBe(false);
      expect(prisma.products.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false },
        select: expect.any(Object),
      });
    });

    it('존재하지 않는 상품이면 에러를 던져야 합니다', async () => {
      // Given
      (prisma.products.findFirst as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(productService.deleteProduct(mockCompanyId, 999)).rejects.toThrow(CustomError);
    });
  });
});
