import type { Config } from 'jest';

const config: Config = {
  // 테스트 환경
  testEnvironment: 'node',

  // TypeScript 파일 변환을 위한 preset
  preset: 'ts-jest',

  // 테스트 파일 패턴
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
    '**/*.test.ts',
    '**/*.spec.ts',
  ],

  // 테스트에서 제외할 경로
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // 커버리지 수집 대상
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.types.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/swagger/**',
  ],

  // 커버리지 리포트 형식
  coverageReporters: ['text', 'lcov', 'html'],

  // 커버리지 디렉토리
  coverageDirectory: 'coverage',

  // 모듈 경로 매핑 (tsconfig.json의 paths와 동일)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // 테스트 실행 전 설정 파일
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  // 테스트 타임아웃 (10초)
  testTimeout: 10000,

  // 각 테스트 파일 실행 전/후 설정
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // 상세 출력
  verbose: true,

  // 커버리지 임계값 (선택사항)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

export default config;
