import { prisma } from '../../common/database/prisma.client';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import type { CompanyUserQuery, UpdateCompanyNameBody } from './company.types';

export const companyService = {
  // 회사 상세 정보 조회
  async getCompanyDetail(companyId: string) {
    const company = await prisma.companies.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        'Company not found'
      );
    }
    return company;
  },

  // 회사 소속 유저 조회 (pagination 포함)
  async getCompanyUsers(companyId: string, query: CompanyUserQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = {
      companyId,
      ...(query.role ? { role: query.role } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };

    const [total, users] = await Promise.all([
      prisma.users.count({ where }),
      prisma.users.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { users, pagination: { page, limit, total } };
  },

  // 회사명 변경
  async updateCompanyName(companyId: string, payload: UpdateCompanyNameBody) {
    // 회사 존재 여부 확인
    const company = await prisma.companies.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        'Company not found'
      );
    }

    const updated = await prisma.companies.update({
      where: { id: companyId },
      data: { name: payload.name },
    });

    return updated;
  },
};
