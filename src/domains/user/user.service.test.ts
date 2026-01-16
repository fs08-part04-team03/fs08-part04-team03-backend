import argon2 from 'argon2';
import { prisma } from '@/common/database/prisma.client';
import { CustomError } from '@/common/utils/error.util';
import { HttpStatus } from '@/common/constants/httpStatus.constants';
import { ErrorCodes } from '@/common/constants/errorCodes.constants';
import { userService } from './user.service';

// Argon2 모킹
jest.mock('argon2', () => ({
  hash: jest.fn(),
}));

// Prisma 모킹
jest.mock('@/common/database/prisma.client', () => {
  const mockUsersFind = jest.fn();
  const mockUsersFindMany = jest.fn();
  const mockUsersUpdate = jest.fn();
  const mockUsersCount = jest.fn();
  const mockCompaniesFind = jest.fn();
  const mockCompaniesUpdate = jest.fn();

  const mockPrisma = {
    users: {
      findUnique: mockUsersFind,
      findMany: mockUsersFindMany,
      update: mockUsersUpdate,
      count: mockUsersCount,
    },
    companies: {
      findUnique: mockCompaniesFind,
      update: mockCompaniesUpdate,
    },
    $transaction: (callback: (tx: unknown) => unknown) =>
      callback({
        users: {
          findUnique: mockUsersFind,
          findMany: mockUsersFindMany,
          update: mockUsersUpdate,
          count: mockUsersCount,
        },
        companies: {
          findUnique: mockCompaniesFind,
          update: mockCompaniesUpdate,
        },
      }),
  };

  return { prisma: mockPrisma };
});

describe('UserService', () => {
  const userSafeSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    isActive: true,
    companyId: true,
    createdAt: true,
    updatedAt: true,
  };
  const mockUserId = 'user-123';
  const mockCompanyId = 'company-123';
  const mockUser = {
    id: mockUserId,
    companyId: mockCompanyId,
    email: 'test@example.com',
    name: '테스트 유저',
    role: 'USER' as const,
    isActive: true,
    password: 'hashed-password',
    refreshToken: null,
    profileImage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('활성 사용자의 프로필을 조회해야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // When
      const result = await userService.getProfile(mockUserId);

      // Then
      expect(result).toMatchObject({
        id: mockUserId,
        companyId: mockCompanyId,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        isActive: true,
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('사용자를 찾을 수 없으면 에러를 발생시켜야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(userService.getProfile(mockUserId)).rejects.toThrow(CustomError);
      await expect(userService.getProfile(mockUserId)).rejects.toMatchObject({
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCodes.USER_NOT_FOUND,
      });
    });

    it('비활성화된 사용자일 경우 에러를 발생시켜야 합니다', async () => {
      // Given
      const inactiveUser = { ...mockUser, isActive: false };
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(inactiveUser);

      // When & Then
      await expect(userService.getProfile(mockUserId)).rejects.toThrow(CustomError);
      await expect(userService.getProfile(mockUserId)).rejects.toMatchObject({
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: ErrorCodes.AUTH_UNAUTHORIZED,
        message: '비활성화된 계정입니다.',
      });
    });
  });

  describe('updateMyProfile', () => {
    it('비밀번호를 변경해야 합니다', async () => {
      // Given
      const newPassword = 'newPassword123!';
      const hashedPassword = 'hashed-new-password';

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (prisma.users.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      // When
      await userService.updateMyProfile(mockUserId, newPassword);

      // Then
      expect(argon2.hash).toHaveBeenCalledWith(newPassword);
      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUserId },
          data: { password: hashedPassword, refreshToken: null },
        })
      );
    });

    it('비활성화된 사용자는 비밀번호를 변경할 수 없어야 합니다', async () => {
      // Given
      const inactiveUser = { ...mockUser, isActive: false };
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(inactiveUser);

      // When & Then
      await expect(userService.updateMyProfile(mockUserId, 'newPassword')).rejects.toThrow(
        CustomError
      );
      await expect(userService.updateMyProfile(mockUserId, 'newPassword')).rejects.toMatchObject({
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: ErrorCodes.AUTH_UNAUTHORIZED,
      });
    });
  });

  describe('adminPatchProfile', () => {
    const mockAdminId = 'admin-123';
    const mockAdmin = {
      ...mockUser,
      id: mockAdminId,
      role: 'ADMIN' as const,
    };

    it('관리자가 회사명을 변경해야 합니다', async () => {
      // Given
      const mockCompany = {
        id: mockCompanyId,
        name: '이전 회사명',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (prisma.companies.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.companies.update as jest.Mock).mockResolvedValue({
        ...mockCompany,
        name: '새 회사명',
      });

      // When
      await userService.adminPatchProfile(mockAdminId, mockCompanyId, {
        companyName: '새 회사명',
      });

      // Then
      expect(prisma.companies.update).toHaveBeenCalledWith({
        where: { id: mockCompanyId },
        data: { name: '새 회사명' },
      });
    });

    it('관리자가 자신의 비밀번호를 변경해야 합니다', async () => {
      // Given
      const newPassword = 'newPassword123!';
      const hashedPassword = 'hashed-new-password';

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (prisma.users.update as jest.Mock).mockResolvedValue({
        ...mockAdmin,
        password: hashedPassword,
      });

      // When
      await userService.adminPatchProfile(mockAdminId, mockCompanyId, { newPassword });

      // Then
      expect(argon2.hash).toHaveBeenCalledWith(newPassword);
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: mockAdminId },
        data: { password: hashedPassword, refreshToken: null },
      });
    });

    it('회사와 비밀번호를 모두 변경해야 합니다', async () => {
      // Given
      const newPassword = 'newPassword123!';
      const hashedPassword = 'hashed-new-password';
      const mockCompany = {
        id: mockCompanyId,
        name: '이전 회사명',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (prisma.companies.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.companies.update as jest.Mock).mockResolvedValue({
        ...mockCompany,
        name: '새 회사명',
      });
      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (prisma.users.update as jest.Mock).mockResolvedValue({
        ...mockAdmin,
        password: hashedPassword,
      });

      // When
      await userService.adminPatchProfile(mockAdminId, mockCompanyId, {
        companyName: '새 회사명',
        newPassword,
      });

      // Then
      expect(prisma.companies.update).toHaveBeenCalled();
      expect(prisma.users.update).toHaveBeenCalled();
    });

    it('비활성화된 관리자는 프로필을 변경할 수 없어야 합니다', async () => {
      // Given
      const inactiveAdmin = { ...mockAdmin, isActive: false };
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(inactiveAdmin);

      // When & Then
      await expect(
        userService.adminPatchProfile(mockAdminId, mockCompanyId, { companyName: '새 회사명' })
      ).rejects.toThrow(CustomError);
    });
  });

  describe('updateRole', () => {
    const mockAdminId = 'admin-123';
    const mockTargetUserId = 'user-456';
    const mockAdmin = {
      ...mockUser,
      id: mockAdminId,
      role: 'ADMIN' as const,
    };
    const mockTargetUser = {
      ...mockUser,
      id: mockTargetUserId,
      role: 'USER' as const,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('다른 사용자의 권한을 변경해야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdmin)
        .mockResolvedValueOnce(mockTargetUser);

      (prisma.users.update as jest.Mock).mockResolvedValue({
        ...mockTargetUser,
        role: 'MANAGER',
      });

      // When
      const result = await userService.updateRole(
        mockCompanyId,
        mockTargetUserId,
        'MANAGER',
        mockAdminId
      );

      // Then
      expect(result.role).toBe('MANAGER');
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: mockTargetUserId },
        data: { role: 'MANAGER' },
        select: userSafeSelect,
      });
    });

    it('관리자가 자신의 ADMIN 권한을 변경하려고 하면 에러를 발생시켜야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdmin) // ensureActiveUserInCompany - getUser
        .mockResolvedValueOnce(mockAdmin); // getUserInCompany - getUser

      // When & Then
      await expect(
        userService.updateRole(mockCompanyId, mockAdminId, 'USER', mockAdminId)
      ).rejects.toMatchObject({
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: ErrorCodes.AUTH_FORBIDDEN,
        message: '관리자가 스스로 ADMIN 권한을 변경할 수 없습니다.',
      });
    });

    it('다른 회사 사용자의 권한은 변경할 수 없어야 합니다', async () => {
      // Given
      const differentCompanyUser = { ...mockTargetUser, companyId: 'different-company' };

      (prisma.users.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdmin) // ensureActiveUserInCompany - getUser
        .mockResolvedValueOnce(differentCompanyUser); // getUserInCompany - getUser

      // When & Then
      await expect(
        userService.updateRole(mockCompanyId, mockTargetUserId, 'MANAGER', mockAdminId)
      ).rejects.toMatchObject({
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: ErrorCodes.AUTH_FORBIDDEN,
      });
    });
  });

  describe('updateStatus', () => {
    const mockAdminId = 'admin-123';
    const mockTargetUserId = 'user-456';
    const mockAdmin = {
      ...mockUser,
      id: mockAdminId,
      role: 'ADMIN' as const,
    };
    const mockTargetUser = {
      ...mockUser,
      id: mockTargetUserId,
      role: 'USER' as const,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('다른 사용자를 비활성화해야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdmin)
        .mockResolvedValueOnce(mockTargetUser);

      (prisma.users.update as jest.Mock).mockResolvedValue({
        ...mockTargetUser,
        isActive: false,
      });

      // When
      const result = await userService.updateStatus(
        mockCompanyId,
        mockTargetUserId,
        false,
        mockAdminId
      );

      // Then
      expect(result.isActive).toBe(false);
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: mockTargetUserId },
        data: { isActive: false, refreshToken: null },
        select: userSafeSelect,
      });
    });

    it('다른 사용자를 활성화해야 합니다', async () => {
      // Given
      const inactiveUser = { ...mockTargetUser, isActive: false };
      (prisma.users.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdmin)
        .mockResolvedValueOnce(inactiveUser);

      (prisma.users.update as jest.Mock).mockResolvedValue({
        ...inactiveUser,
        isActive: true,
      });

      // When
      const result = await userService.updateStatus(
        mockCompanyId,
        mockTargetUserId,
        true,
        mockAdminId
      );

      // Then
      expect(result.isActive).toBe(true);
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: mockTargetUserId },
        data: { isActive: true, refreshToken: undefined },
        select: userSafeSelect,
      });
    });

    it('자신의 활성 여부는 변경할 수 없어야 합니다', async () => {
      // Given
      (prisma.users.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdmin) // ensureActiveUserInCompany - getUser
        .mockResolvedValueOnce(mockAdmin); // getUserInCompany - getUser

      // When & Then
      await expect(
        userService.updateStatus(mockCompanyId, mockAdminId, false, mockAdminId)
      ).rejects.toMatchObject({
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: ErrorCodes.AUTH_FORBIDDEN,
        message: '자신의 활성 여부를 변경할 수 없습니다.',
      });
    });
  });

  describe('listUsers', () => {
    const mockAdminId = 'admin-123';
    const mockAdmin = {
      ...mockUser,
      id: mockAdminId,
      role: 'ADMIN' as const,
    };

    it('회사 소속 사용자 목록을 조회해야 합니다', async () => {
      // Given
      const mockUsers = [
        { ...mockUser, id: 'user-1', name: '사용자1' },
        { ...mockUser, id: 'user-2', name: '사용자2' },
      ];

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (prisma.users.count as jest.Mock).mockResolvedValue(2);
      (prisma.users.findMany as jest.Mock).mockResolvedValue(mockUsers);

      // When
      const result = await userService.listUsers(mockCompanyId, mockAdminId, {});

      // Then
      expect(result.users).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
      });
    });

    it('특정 역할의 사용자만 필터링해야 합니다', async () => {
      // Given
      const mockManagers = [{ ...mockUser, id: 'manager-1', role: 'MANAGER' as const }];

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (prisma.users.count as jest.Mock).mockResolvedValue(1);
      (prisma.users.findMany as jest.Mock).mockResolvedValue(mockManagers);

      // When
      await userService.listUsers(mockCompanyId, mockAdminId, { role: 'MANAGER' });

      // Then
      expect(prisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: mockCompanyId,
            role: 'MANAGER',
          }),
        })
      );
    });

    it('활성 상태로 필터링해야 합니다', async () => {
      // Given
      const mockActiveUsers = [{ ...mockUser, id: 'user-1', isActive: true }];

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (prisma.users.count as jest.Mock).mockResolvedValue(1);
      (prisma.users.findMany as jest.Mock).mockResolvedValue(mockActiveUsers);

      // When
      await userService.listUsers(mockCompanyId, mockAdminId, { isActive: true });

      // Then
      expect(prisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: mockCompanyId,
            isActive: true,
          }),
        })
      );
    });

    it('검색어로 사용자를 검색해야 합니다', async () => {
      // Given
      const searchQuery = 'test';
      const mockSearchedUsers = [{ ...mockUser, id: 'user-1', email: 'test@example.com' }];

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (prisma.users.count as jest.Mock).mockResolvedValue(1);
      (prisma.users.findMany as jest.Mock).mockResolvedValue(mockSearchedUsers);

      // When
      await userService.listUsers(mockCompanyId, mockAdminId, { q: searchQuery });

      // Then
      expect(prisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { email: { contains: searchQuery, mode: 'insensitive' } },
              { name: { contains: searchQuery, mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });
  });
});
