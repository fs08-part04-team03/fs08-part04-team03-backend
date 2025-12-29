import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line import/no-extraneous-dependencies
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

/**
 * Prisma Client Mock
 * 단위 테스트에서 데이터베이스 접근을 모킹하기 위한 헬퍼
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

/**
 * 각 테스트 전에 mock을 초기화
 */
beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  mockReset(prismaMock);
});

/**
 * Prisma 모듈을 모킹
 */
jest.mock('@/common/database/prisma.client', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  prisma: prismaMock,
}));
