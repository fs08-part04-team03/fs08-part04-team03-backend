# Integration Tests (Deprecated)

**주의**: 이 디렉토리는 더 이상 사용되지 않습니다. 대신 `src/__tests__/e2e/` 디렉토리의 E2E 테스트를 사용하세요.

E2E 테스트는 실제 데이터베이스와 Express 앱을 사용하여 전체 흐름을 테스트합니다.

## E2E 테스트 실행

```bash
npm run test:e2e
```

## 통합 테스트 작성 가이드 (참고용)

통합 테스트를 작성할 때는 다음 사항을 고려하세요:

1. **테스트 데이터베이스 사용**
   - 실제 데이터베이스를 사용하되, 테스트 전용 데이터베이스를 사용하세요
   - `.env.test` 파일에 테스트 데이터베이스 URL을 설정하세요

2. **데이터 정리**
   - 각 테스트 후 데이터베이스를 정리하여 테스트 간 독립성을 보장하세요
   - `beforeEach` 또는 `afterEach`에서 데이터 정리를 수행하세요

3. **실제 미들웨어 사용**
   - 인증, 권한 검사 등 실제 미들웨어를 사용하여 테스트하세요
   - 필요한 경우 테스트용 토큰을 생성하여 사용하세요

## 예시: API 통합 테스트

```typescript
import request from 'supertest';
import { app } from '@/index'; // 실제 앱 import
import { prisma } from '@/common/database/prisma.client';
import { JwtUtil } from '@/common/utils/jwt.util';

describe('Product API Integration Tests', () => {
  let authToken: string;
  let testUser: any;
  let testCompany: any;

  beforeAll(async () => {
    // 테스트 회사 생성
    testCompany = await prisma.companies.create({
      data: {
        name: '테스트 회사',
        businessNumber: '123-45-67890',
      },
    });

    // 테스트 사용자 생성
    testUser = await prisma.users.create({
      data: {
        companyId: testCompany.id,
        email: 'test@example.com',
        password: 'hashed-password',
        name: '테스트 사용자',
        role: 'ADMIN',
      },
    });

    // 인증 토큰 생성
    authToken = JwtUtil.generateAccessToken({
      id: testUser.id,
      companyId: testUser.companyId,
      email: testUser.email,
      role: testUser.role,
    });
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.users.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.companies.delete({ where: { id: testCompany.id } });
    await prisma.$disconnect();
  });

  it('상품 목록을 조회하면 200을 반환해야 합니다', async () => {
    const response = await request(app)
      .get('/api/v1/product')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('products');
  });
});
```

## 현재 상태

현재는 단위 테스트(Unit Test)만 구현되어 있습니다. 통합 테스트는 필요에 따라 추가로 작성할 수 있습니다.

단위 테스트로도 대부분의 비즈니스 로직을 검증할 수 있으며, 통합 테스트는 실제 API 호출이 필요한 경우에만 작성하는 것을 권장합니다.
