import { prisma } from '@/common/database/prisma.client';

// 각 테스트 파일 실행 후 Prisma 연결 종료
afterAll(async () => {
  await prisma.$disconnect();
});

// 환경 변수 설정 (테스트용)
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = '46797bf842cec4d7e5fdf8c4e3332ec1e8ffdbac223ed303fb89c8eead74b50f';
process.env.JWT_REFRESH_SECRET = '0b4a746450ac6e9600632b8deee6a31b28e4e7ce74c1b500acfbcf08a0bbdcd8';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
