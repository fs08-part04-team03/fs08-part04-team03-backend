import { prisma } from '../../common/database/prisma.client';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';

export const companyService = {
  // 회사 상세 정보 조회
  async getCompanyDetail(companyId: string) {
    const company = await prisma.companies.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        '회사를 찾을 수 없습니다.'
      );
    }
    return company;
  },
};
