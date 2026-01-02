import { purchaseStatus, type Prisma } from '@prisma/client';
import { prisma } from '../../common/database/prisma.client';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import type {
  CreateProductBody,
  ProductListQuery,
  ProductSort,
  UpdateProductBody,
} from './product.types';

const productSelect = {
  id: true,
  categoryId: true,
  name: true,
  price: true,
  image: true,
  link: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

// 정렬 기준 (기본값: createdAt 내림차순)
const defaultSort: ProductSort = 'latest';
const buildOrderBy = (sort: ProductSort): Prisma.productsOrderByWithRelationInput[] => {
  if (sort === 'priceAsc') {
    return [{ price: 'asc' }, { id: 'desc' }];
  }
  if (sort === 'priceDesc') {
    return [{ price: 'desc' }, { id: 'desc' }];
  }
  return [{ createdAt: 'desc' }, { id: 'desc' }];
};

// 판매량(승인된 구매 수량 합) 집계 헬퍼
type ProductRow = Prisma.productsGetPayload<{ select: typeof productSelect }>;
type ProductWithSales = ProductRow & { salesCount: number };
const sumKey = '_sum' as const;
const salesCounts = async (
  companyId: string,
  products: ProductRow[]
): Promise<ProductWithSales[]> => {
  if (products.length === 0) return [];

  const productIds = products.map((product) => product.id);

  // APPROVED 상태의 구매만 집계
  const sales = await prisma.purchaseItems.groupBy({
    by: ['productId'],
    where: {
      productId: { in: productIds },
      purchaseRequests: {
        status: purchaseStatus.APPROVED,
        companyId,
      },
    },
    _sum: { quantity: true },
  });

  // 상품 ID별 판매 개수 매핑 (판매 이력 없는 상품은 0)
  const salesMap = new Map<number, number>();
  sales.forEach((item) => {
    const sum = item[sumKey];
    salesMap.set(item.productId, sum?.quantity ?? 0);
  });

  // 각 상품에 salesCount 추가
  return products.map((product) => ({
    ...product,
    salesCount: salesMap.get(product.id) ?? 0,
  }));
};

export const productService = {
  // 상품 생성 (생성 시 isActive는 항상 true)
  async createProduct(companyId: string, createdById: string, payload: CreateProductBody) {
    const { categoryId, name, price, image, link } = payload;

    // 카테고리 존재 확인
    const category = await prisma.categoies.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        '카테고리를 찾을 수 없습니다.'
      );
    }

    const product = await prisma.products.create({
      data: {
        companyId,
        createdById,
        categoryId,
        name,
        price,
        image,
        link,
        isActive: true,
      },
      select: productSelect,
    });

    return product;
  },

  // 상품 목록 조회 (페이징, 카테고리 필터, 정렬)
  async getProducts(companyId: string, query: ProductListQuery, createdById?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sort = query.sort ?? defaultSort;
    const skip = (page - 1) * limit;

    // 회사/카테고리 필터
    const where = {
      companyId,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      isActive: true,
      ...(createdById ? { createdById } : {}),
    };

    // 페이징용 total 계산
    const total = await prisma.products.count({ where });
    if (total === 0) {
      return { products: [], page, limit, total };
    }

    // 판매량 정렬은 집계가 필요해 전체 조회 후 정렬
    if (sort === 'sales') {
      const products = await prisma.products.findMany({
        where,
        select: productSelect,
      });

      const productIds = products.map((product) => product.id);
      const salesMap = new Map<number, number>();

      // APPROVED 상태의 구매만 집계
      if (productIds.length > 0) {
        const sales = await prisma.purchaseItems.groupBy({
          by: ['productId'],
          where: {
            productId: { in: productIds },
            purchaseRequests: {
              status: purchaseStatus.APPROVED,
              companyId,
            },
          },
          _sum: { quantity: true },
        });

        sales.forEach((item) => {
          const sum = item[sumKey];
          salesMap.set(item.productId, sum?.quantity ?? 0);
        });
      }

      // 판매량 -> 생성일 -> ID 기준 정렬
      const sorted = products.sort((a, b) => {
        const salesA = salesMap.get(a.id) ?? 0;
        const salesB = salesMap.get(b.id) ?? 0;
        if (salesB !== salesA) return salesB - salesA;
        if (a.createdAt.getTime() !== b.createdAt.getTime()) {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        return b.id - a.id;
      });

      // 정렬 후 페이징
      const paged = sorted.slice(skip, skip + limit);
      const pagedWithSales = paged.map((product) => ({
        ...product,
        salesCount: salesMap.get(product.id) ?? 0,
      }));

      return { products: pagedWithSales, page, limit, total };
    }

    const products = await prisma.products.findMany({
      where,
      select: productSelect,
      orderBy: buildOrderBy(sort),
      skip,
      take: limit,
    });

    const productsWithSales = await salesCounts(companyId, products);
    return { products: productsWithSales, page, limit, total };
  },

  // 상품 상세 조회
  async getProductDetail(companyId: string, productId: number) {
    const product = await prisma.products.findFirst({
      where: {
        id: productId,
        companyId,
        isActive: true,
      },
      select: productSelect,
    });

    if (!product) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        '상품을 찾을 수 없습니다.'
      );
    }

    // 판매량 집계
    const sales = await prisma.purchaseItems.aggregate({
      where: {
        productId: product.id,
        purchaseRequests: {
          status: purchaseStatus.APPROVED,
          companyId,
        },
      },
      _sum: { quantity: true },
    });
    const sum = sales[sumKey];
    const salesCount = sum?.quantity ?? 0;

    return { ...product, salesCount };
  },

  // 상품 수정
  async updateProduct(companyId: string, productId: number, payload: UpdateProductBody) {
    const existing = await prisma.products.findFirst({
      where: { id: productId, companyId },
      select: { id: true },
    });

    if (!existing) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        '상품을 찾을 수 없습니다.'
      );
    }

    if (payload.categoryId !== undefined) {
      const category = await prisma.categoies.findUnique({
        where: { id: payload.categoryId },
        select: { id: true },
      });
      if (!category) {
        throw new CustomError(
          HttpStatus.NOT_FOUND,
          ErrorCodes.GENERAL_NOT_FOUND,
          '카테고리를 찾을 수 없습니다.'
        );
      }
    }

    const data: Prisma.productsUpdateInput = {};

    if (payload.categoryId !== undefined) {
      data.categoies = { connect: { id: payload.categoryId } };
    }
    if (payload.name !== undefined) data.name = payload.name;
    if (payload.price !== undefined) data.price = payload.price;
    if (payload.image !== undefined) data.image = payload.image; // null 허용
    if (payload.link !== undefined) data.link = payload.link;

    const updated = await prisma.products.update({
      where: { id: productId },
      data,
      select: productSelect,
    });

    return updated;
  },

  // 상품 삭제 (논리 삭제: isActive를 false로 변경)
  async deleteProduct(companyId: string, productId: number) {
    const existing = await prisma.products.findFirst({
      where: { id: productId, companyId },
      select: { id: true },
    });

    if (!existing) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        '상품을 찾을 수 없습니다.'
      );
    }

    const updated = await prisma.products.update({
      where: { id: productId },
      data: { isActive: false },
      select: productSelect,
    });

    return updated;
  },
};
