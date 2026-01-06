import { purchaseStatus, type Prisma } from '@prisma/client';
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '../../common/database/prisma.client';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { s3Client, S3_BUCKET_NAME, PRESIGNED_URL_EXPIRES_IN } from '../../config/s3.config';
import { uploadService } from '../upload/upload.service';
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
  async createProduct(
    companyId: string,
    createdById: string,
    payload: CreateProductBody,
    file?: Express.Multer.File
  ) {
    const { categoryId, name, price, link } = payload;

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

    let imageKey: string | null = null;
    let uploadedFileKey: string | null = null;

    try {
      // Step 1: 이미지 파일이 있으면 S3에 업로드
      if (file) {
        const uploadResult = await uploadService.uploadImage(
          file,
          createdById,
          companyId,
          undefined, // productId는 아직 생성되지 않음
          'products'
        );
        imageKey = uploadResult.data.key;
        uploadedFileKey = imageKey;
      }

      // Step 2 & 3: 상품 생성 및 uploads 업데이트를 트랜잭션으로 처리
      const product = await prisma.$transaction(async (tx) => {
        const newProduct = await tx.products.create({
          data: {
            companyId,
            createdById,
            categoryId,
            name,
            price,
            image: imageKey,
            link,
            isActive: true,
          },
          select: productSelect,
        });

        // uploads 테이블의 레코드에 productId 업데이트
        if (uploadedFileKey) {
          await tx.uploads.update({
            where: { key: uploadedFileKey },
            data: { productId: newProduct.id },
          });
        }

        return newProduct;
      });

      return product;
    } catch (error) {
      // Cleanup: 상품 생성 실패 시 업로드된 이미지 삭제
      if (uploadedFileKey) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: S3_BUCKET_NAME,
              Key: uploadedFileKey,
            })
          );
          // deleteMany는 레코드가 없어도 예외를 발생시키지 않음
          await prisma.uploads.deleteMany({
            where: { key: uploadedFileKey },
          });
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded file:', cleanupError);
        }
      }
      throw error;
    }
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

      // Presigned URL 생성
      const productsWithUrls = await Promise.all(
        pagedWithSales.map(async (product) => ({
          ...product,
          imageUrl: await getPresignedUrlForProduct(product.image),
        }))
      );

      return { products: productsWithUrls, page, limit, total };
    }

    const products = await prisma.products.findMany({
      where,
      select: productSelect,
      orderBy: buildOrderBy(sort),
      skip,
      take: limit,
    });

    const productsWithSales = await salesCounts(companyId, products);

    // Presigned URL 생성
    const productsWithUrls = await Promise.all(
      productsWithSales.map(async (product) => ({
        ...product,
        imageUrl: await getPresignedUrlForProduct(product.image),
      }))
    );

    return { products: productsWithUrls, page, limit, total };
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

    // Presigned URL 생성
    const imageUrl = await getPresignedUrlForProduct(product.image);

    return { ...product, salesCount, imageUrl };
  },

  // 상품 수정
  async updateProduct(
    companyId: string,
    userId: string,
    productId: number,
    payload: UpdateProductBody,
    file?: Express.Multer.File,
    removeImage?: boolean
  ) {
    // 상품 존재 확인 (현재 image key 조회)
    const existing = await prisma.products.findFirst({
      where: { id: productId, companyId },
      select: { id: true, image: true },
    });

    if (!existing) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        '상품을 찾을 수 없습니다.'
      );
    }

    // 카테고리 변경 시 존재 확인
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

    let newImageKey: string | null = null;
    const oldImageKey = existing.image;

    try {
      // 새 이미지 파일이 있으면 S3에 업로드
      if (file) {
        const uploadResult = await uploadService.uploadImage(
          file,
          userId,
          companyId,
          productId,
          'products'
        );
        newImageKey = uploadResult.data.key;
      }

      // 업데이트 데이터 구성
      const data: Prisma.productsUpdateInput = {};

      if (payload.categoryId !== undefined) {
        data.categoies = { connect: { id: payload.categoryId } };
      }
      if (payload.name !== undefined) data.name = payload.name;
      if (payload.price !== undefined) data.price = payload.price;
      if (payload.link !== undefined) data.link = payload.link;

      // 이미지 처리
      if (newImageKey) {
        // 새 이미지로 교체
        data.image = newImageKey;
      } else if (removeImage) {
        // 명시적 이미지 제거
        data.image = null;
      }

      // 상품 업데이트
      const updated = await prisma.products.update({
        where: { id: productId },
        data,
        select: productSelect,
      });

      // 기존 이미지 삭제 (새 이미지 업로드 또는 명시적 제거 시)
      if ((newImageKey || removeImage) && oldImageKey) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: S3_BUCKET_NAME,
              Key: oldImageKey,
            })
          );
          // deleteMany는 레코드가 없어도 예외를 발생시키지 않음
          await prisma.uploads.deleteMany({
            where: { key: oldImageKey },
          });
        } catch (cleanupError) {
          // 로그만 남기고 진행 (상품 업데이트는 성공)
          console.error('Failed to cleanup old image:', cleanupError);
        }
      }

      return updated;
    } catch (error) {
      // Cleanup: 상품 업데이트 실패 시 새로 업로드된 이미지 삭제
      if (newImageKey && newImageKey !== oldImageKey) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: S3_BUCKET_NAME,
              Key: newImageKey,
            })
          );
          // deleteMany는 레코드가 없어도 예외를 발생시키지 않음
          await prisma.uploads.deleteMany({
            where: { key: newImageKey },
          });
        } catch (cleanupError) {
          console.error('Failed to cleanup new image:', cleanupError);
        }
      }
      throw error;
    }
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
