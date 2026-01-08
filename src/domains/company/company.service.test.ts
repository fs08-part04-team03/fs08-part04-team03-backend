import { prisma } from '@/common/database/prisma.client';
import { CustomError } from '@/common/utils/error.util';
import { HttpStatus } from '@/common/constants/httpStatus.constants';
import { ErrorCodes } from '@/common/constants/errorCodes.constants';
import { companyService } from './company.service';

// Prisma 모킹
jest.mock('@/common/database/prisma.client', () => ({
  prisma: {
    companies: {
      findUnique: jest.fn(),
    },
  },
}));

describe('CompanyService', () => {
  const mockCompanyId = 'company-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCompanyDetail', () => {
    it('회사 상세 정보를 조회해야 합니다', async () => {
      // Given
      const mockCompany = {
        id: mockCompanyId,
        name: '테스트 회사',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (prisma.companies.findUnique as jest.Mock).mockResolvedValue(mockCompany);

      // When
      const result = await companyService.getCompanyDetail(mockCompanyId);

      // Then
      expect(result).toEqual(mockCompany);
      expect(prisma.companies.findUnique).toHaveBeenCalledWith({
        where: { id: mockCompanyId },
      });
    });

    it('회사를 찾을 수 없으면 에러를 발생시켜야 합니다', async () => {
      // Given
      (prisma.companies.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(companyService.getCompanyDetail(mockCompanyId)).rejects.toThrow(CustomError);
      await expect(companyService.getCompanyDetail(mockCompanyId)).rejects.toMatchObject({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCodes.GENERAL_NOT_FOUND,
        message: '회사를 찾을 수 없습니다.',
      });
    });

    it('회사 ID가 유효하지 않으면 에러를 발생시켜야 합니다', async () => {
      // Given
      const invalidCompanyId = 'invalid-company-id';
      (prisma.companies.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(companyService.getCompanyDetail(invalidCompanyId)).rejects.toThrow(CustomError);
      await expect(companyService.getCompanyDetail(invalidCompanyId)).rejects.toMatchObject({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCodes.GENERAL_NOT_FOUND,
      });
    });
  });
});
