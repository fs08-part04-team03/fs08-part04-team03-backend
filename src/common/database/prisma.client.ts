import { PrismaClient } from '@prisma/client';
import { getTenantContext } from '../utils/tenant-context.util';

/**
 * companyId 필드가 있는 모델 목록
 * 이 모델들은 자동으로 companyId 필터가 적용됩니다.
 */
const TENANT_MODELS = [
  'products',
  'carts',
  'wishlists',
  'purchaseRequests',
  'budgets',
  'users',
  'companies',
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

        return query({
          ...args,
          where: { ...args.where, companyId: context.companyId },
        });
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

        return query({
          ...args,
          where: { ...args.where, companyId: context.companyId },
        });
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

        return query({
          ...args,
          where: { ...args.where, companyId: context.companyId },
        });
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
