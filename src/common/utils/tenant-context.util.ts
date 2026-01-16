import { AsyncLocalStorage } from 'async_hooks';

/**
 * 테넌트 컨텍스트 타입
 * 현재 요청의 companyId를 저장합니다.
 */
type TenantContext = {
  companyId: string;
  userId: string;
};

/**
 * AsyncLocalStorage를 사용하여 요청별 테넌트 컨텍스트 관리
 * 이를 통해 Prisma middleware에서 현재 요청의 companyId에 접근할 수 있습니다.
 */
export const tenantContext = new AsyncLocalStorage<TenantContext>();

/**
 * 현재 요청의 테넌트 컨텍스트를 가져옵니다.
 * @returns TenantContext | undefined
 */
export function getTenantContext(): TenantContext | undefined {
  return tenantContext.getStore();
}

/**
 * 테넌트 컨텍스트를 설정하고 콜백을 실행합니다.
 * @param context - 테넌트 컨텍스트 (companyId, userId)
 * @param callback - 실행할 함수
 */
export function runWithTenantContext<T>(context: TenantContext, callback: () => T): T {
  return tenantContext.run(context, callback);
}
