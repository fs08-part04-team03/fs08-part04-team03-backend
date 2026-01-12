import { PrismaClient } from '@prisma/client';
import { getTenantContext } from '../utils/tenant-context.util';

/**
 * companyId 필드가 있는 모델 목록
 * 이 모델들은 자동으로 companyId 필터가 적용됩니다.
 *
 * 제외된 모델:
 * - carts, wishLists: companyId가 없고 userId로 필터링됨
 * - companies: 회사 자체 테이블로 companyId 필드가 없음
 * - purchaseItems, categories, History: companyId가 없음
 * - invitations: email/token으로 조회하므로 자동 필터 제외
 */
const TENANT_MODELS = [
  'products',
  'purchaseRequests',
  'budgets',
  'budgetCriteria',
  'users',
  'uploads',
] as const;

type TenantModel = (typeof TENANT_MODELS)[number];

/**
 * Prisma Query Extension 파라미터 타입
 */
interface QueryParams<T = unknown> {
  model: string;
  operation: string;
  args: T;
  query: (args: T) => Promise<unknown>;
}

/**
 * Where 조건이 포함된 Args 타입
 */
interface ArgsWithWhere {
  where?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Create 작업을 위한 Args 타입
 */
interface CreateArgs {
  data?: Record<string, unknown>;
  [key: string]: unknown;
}
/**
 * Upsert 작업을 위한 Args 타입
 */
interface UpsertArgs {
  where?: Record<string, unknown>;
  create?: Record<string, unknown>;
  update?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * CreateMany 작업을 위한 Args 타입
 */
interface CreateManyArgs {
  data?: Record<string, unknown>[] | Record<string, unknown>;
  [key: string]: unknown;
}

const basePrisma = new PrismaClient();

/**
 * 테넌트 격리 Prisma Client Extension
 *
 * 모든 데이터베이스 쿼리에 자동으로 companyId 필터를 추가합니다.
 * - findMany, findFirst, findUnique, count, aggregate 등의 read 작업
 * - update, updateMany, delete, deleteMany 등의 write 작업
 *
 * AsyncLocalStorage의 테넌트 컨텍스트에서 companyId를 가져와
 * 자동으로 where 조건에 추가합니다.
 *
 * 주의사항:
 * - 컨텍스트가 없는 경우(예: 시스템 작업, 크론 작업)는 필터 적용 안 됨
 * - auth 관련 테이블(history 등)은 필터 제외
 */
export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async findUnique({ model, operation: _operation, args, query }: QueryParams<ArgsWithWhere>) {
        const context = getTenantContext();
        if (!context || !TENANT_MODELS.includes(model as TenantModel)) {
          return query(args);
        }

        // findUnique는 고유 제약과 정확히 일치해야 하므로 companyId를 where에 추가할 수 없음
        // 대신 결과를 조회한 후 companyId를 검증
        // 복합 고유 키에 companyId가 포함된 경우(users, budgets)는 이미 where에 포함되어야 함
        const result = await query(args);

        // 결과가 있고 companyId 필드가 있는 경우, 테넌트 격리 검증
        if (
          result &&
          typeof result === 'object' &&
          'companyId' in result &&
          result.companyId !== context.companyId
        ) {
          // 다른 회사의 데이터에 접근 시도 - null 반환 (보안)
          return null;
        }

        return result;
      },

      async findFirst({ model, operation: _operation, args, query }: QueryParams<ArgsWithWhere>) {
        const context = getTenantContext();
        if (!context || !TENANT_MODELS.includes(model as TenantModel)) {
          return query(args);
        }

        return query({
          ...args,
          where: { ...args.where, companyId: context.companyId },
        });
      },

      async findMany({ model, operation: _operation, args, query }: QueryParams<ArgsWithWhere>) {
        const context = getTenantContext();
        if (!context || !TENANT_MODELS.includes(model as TenantModel)) {
          return query(args);
        }

        return query({
          ...args,
          where: { ...args.where, companyId: context.companyId },
        });
      },

      async count({ model, operation: _operation, args, query }: QueryParams<ArgsWithWhere>) {
        const context = getTenantContext();
        if (!context || !TENANT_MODELS.includes(model as TenantModel)) {
          return query(args);
        }

        return query({
          ...args,
          where: { ...args.where, companyId: context.companyId },
        });
      },

      async aggregate({ model, operation: _operation, args, query }: QueryParams<ArgsWithWhere>) {
        const context = getTenantContext();
        if (!context || !TENANT_MODELS.includes(model as TenantModel)) {
          return query(args);
        }

        return query({
          ...args,
          where: { ...args.where, companyId: context.companyId },
        });
      },

      async groupBy({ model, operation: _operation, args, query }: QueryParams<ArgsWithWhere>) {
        const context = getTenantContext();
        if (!context || !TENANT_MODELS.includes(model as TenantModel)) {
          return query(args);
        }

        return query({
          ...args,
          where: { ...args.where, companyId: context.companyId },
        });
      },

      async update({ model, operation: _operation, args, query }: QueryParams<ArgsWithWhere>) {
        const context = getTenantContext();
        if (!context || !TENANT_MODELS.includes(model as TenantModel)) {
          return query(args);
        }

        // update는 고유 제약만 사용 가능하므로, companyId를 where에 추가할 수 없음
        // 대신 먼저 조회하여 companyId 검증 후 업데이트
        // 복합 고유 키에 companyId가 포함된 경우(users, budgets)는 이미 where에 포함되어야 함

        // 주의: 이 방식은 두 번의 쿼리가 필요하므로 성능에 영향을 줄 수 있음
        // 가능하면 애플리케이션 코드에서 updateMany를 사용하거나
        // where 조건에 companyId를 명시적으로 포함하는 것을 권장
        const existing = await query({ ...args, data: undefined } as ArgsWithWhere);

        if (!existing) {
          throw new Error('Record to update not found.');
        }

        if (
          typeof existing === 'object' &&
          'companyId' in existing &&
          existing.companyId !== context.companyId
        ) {
          throw new Error('Cannot update record from different company.');
        }

        return query(args);
      },

      async updateMany({ model, operation: _operation, args, query }: QueryParams<ArgsWithWhere>) {
        const context = getTenantContext();
        if (!context || !TENANT_MODELS.includes(model as TenantModel)) {
          return query(args);
        }

        return query({
          ...args,
          where: { ...args.where, companyId: context.companyId },
        });
      },

      async delete({ model, operation: _operation, args, query }: QueryParams<ArgsWithWhere>) {
        const context = getTenantContext();
        if (!context || !TENANT_MODELS.includes(model as TenantModel)) {
          return query(args);
        }

        // delete는 고유 제약만 사용 가능하므로, companyId를 where에 추가할 수 없음
        // 대신 먼저 조회하여 companyId 검증 후 삭제
        const existing = await query({ ...args, data: undefined } as ArgsWithWhere);

        if (!existing) {
          throw new Error('Record to delete not found.');
        }

        if (
          typeof existing === 'object' &&
          'companyId' in existing &&
          existing.companyId !== context.companyId
        ) {
          throw new Error('Cannot delete record from different company.');
        }

        return query(args);
      },

      async deleteMany({ model, operation: _operation, args, query }: QueryParams<ArgsWithWhere>) {
        const context = getTenantContext();
        if (!context || !TENANT_MODELS.includes(model as TenantModel)) {
          return query(args);
        }

        return query({
          ...args,
          where: { ...args.where, companyId: context.companyId },
        });
      },

      async upsert({ model, operation: _operation, args, query }: QueryParams<UpsertArgs>) {
        const context = getTenantContext();
        if (!context || !TENANT_MODELS.includes(model as TenantModel)) {
          return query(args);
        }

        return query({
          ...args,
          where: { ...args.where, companyId: context.companyId },
          create: { ...args.create, companyId: context.companyId },
        });
      },

      async create({ model, operation: _operation, args, query }: QueryParams<CreateArgs>) {
        const context = getTenantContext();
        if (!context || !TENANT_MODELS.includes(model as TenantModel)) {
          return query(args);
        }

        if (args.data && typeof args.data === 'object' && !('companyId' in args.data)) {
          return query({
            ...args,
            data: { ...args.data, companyId: context.companyId },
          });
        }

        return query(args);
      },

      async createMany({ model, operation: _operation, args, query }: QueryParams<CreateManyArgs>) {
        const context = getTenantContext();
        if (!context || !TENANT_MODELS.includes(model as TenantModel)) {
          return query(args);
        }

        if (Array.isArray(args.data)) {
          return query({
            ...args,
            data: args.data.map((item: Record<string, unknown>) => {
              if (typeof item === 'object' && item !== null && !('companyId' in item)) {
                return { ...item, companyId: context.companyId };
              }
              return item;
            }),
          });
        }

        return query(args);
      },
    },
  },
});
