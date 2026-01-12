// 환경 변수를 가장 먼저 설정
import argon2 from 'argon2';
import { prisma } from '@/common/database/prisma.client';
import { JwtUtil } from '@/common/utils/jwt.util';
import { CustomError } from '@/common/utils/error.util';
import { ErrorCodes } from '@/common/constants/errorCodes.constants';
import { createHash } from 'node:crypto';
import { authService } from './auth.service';

process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-minimum-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-minimum-32chars';

// Prisma 모킹
jest.mock('@/common/database/prisma.client', () => ({
  prisma: {
    invitations: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    users: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    companies: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    budgetCriteria: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// JWT 유틸리티 모킹
jest.mock('@/common/utils/jwt.util');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const validSignupInput = {
      name: '테스트 사용자',
      email: 'test@example.com',
      password: 'password123!',
      inviteToken: 'valid-token',
    };

    const mockInvitation = {
      id: 'invitation-id',
      companyId: 'company-id',
      email: 'test@example.com',
      role: 'USER' as const,
      isValid: true,
      isUsed: false,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    };

    const mockUser = {
      id: 'user-id',
      companyId: 'company-id',
      email: 'test@example.com',
      name: '테스트 사용자',
      role: 'USER' as const,
    };

    it('정상적으로 회원가입이 완료되어야 합니다', async () => {
      // Given
      const tokenHash = createHash('sha256').update(validSignupInput.inviteToken).digest('hex');

      (prisma.invitations.findUnique as jest.Mock).mockResolvedValue(mockInvitation);
      (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(prisma));
      (prisma.users.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.users.update as jest.Mock).mockResolvedValue({});
      (prisma.invitations.update as jest.Mock).mockResolvedValue({});
      (JwtUtil.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (JwtUtil.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      (JwtUtil.buildAccessPayload as jest.Mock).mockReturnValue({
        companyId: mockUser.companyId,
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });

      // When
      const result = await authService.signup(validSignupInput);

      // Then
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(prisma.invitations.findUnique).toHaveBeenCalledWith({
        where: { token: tokenHash },
      });
      expect(prisma.invitations.update).toHaveBeenCalledWith({
        where: { id: mockInvitation.id },
        data: { isUsed: true, isValid: false },
      });
    });

    it('초대 토큰이 없으면 에러를 던져야 합니다', async () => {
      // Given
      const input = { ...validSignupInput, inviteToken: '' };

      // When & Then
      await expect(authService.signup(input)).rejects.toThrow(CustomError);
    });

    it('유효하지 않은 초대장이면 에러를 던져야 합니다', async () => {
      // Given
      (prisma.invitations.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(authService.signup(validSignupInput)).rejects.toThrow(CustomError);
    });

    it('이미 사용된 초대장이면 에러를 던져야 합니다', async () => {
      // Given
      const usedInvitation = { ...mockInvitation, isUsed: true };
      (prisma.invitations.findUnique as jest.Mock).mockResolvedValue(usedInvitation);

      // When & Then
      await expect(authService.signup(validSignupInput)).rejects.toThrow(CustomError);
    });

    it('만료된 초대장이면 에러를 던져야 합니다', async () => {
      // Given
      const expiredInvitation = {
        ...mockInvitation,
        expiresAt: new Date(Date.now() - 1000),
      };
      (prisma.invitations.findUnique as jest.Mock).mockResolvedValue(expiredInvitation);

      // When & Then
      await expect(authService.signup(validSignupInput)).rejects.toThrow(CustomError);
    });

    it('이미 가입된 이메일이면 에러를 던져야 합니다', async () => {
      // Given
      (prisma.invitations.findUnique as jest.Mock).mockResolvedValue(mockInvitation);
      (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);

      // When & Then
      await expect(authService.signup(validSignupInput)).rejects.toThrow(CustomError);
    });

    it('초대된 이메일과 다르면 에러를 던져야 합니다', async () => {
      // Given
      const differentEmailInvitation = { ...mockInvitation, email: 'different@example.com' };
      (prisma.invitations.findUnique as jest.Mock).mockResolvedValue(differentEmailInvitation);
      (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(authService.signup(validSignupInput)).rejects.toThrow(CustomError);
    });
  });

  describe('adminRegister', () => {
    const validAdminInput = {
      name: '관리자',
      email: 'admin@example.com',
      password: 'password123!',
      companyName: '테스트 회사',
      businessNumber: '123-45-67890',
    };

    const mockCompany = {
      id: 'company-id',
      name: '테스트 회사',
      businessNumber: '123-45-67890',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockAdminUser = {
      id: 'admin-id',
      companyId: 'company-id',
      email: 'admin@example.com',
      name: '관리자',
      role: 'ADMIN' as const,
    };

    it('정상적으로 어드민 회원가입이 완료되어야 합니다', async () => {
      // Given
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(prisma));
      (prisma.companies.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.companies.create as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.budgetCriteria.create as jest.Mock).mockResolvedValue({});
      (prisma.users.create as jest.Mock).mockResolvedValue(mockAdminUser);
      (prisma.users.update as jest.Mock).mockResolvedValue({});
      (JwtUtil.generateAccessToken as jest.Mock).mockReturnValue('admin-access-token');
      (JwtUtil.generateRefreshToken as jest.Mock).mockReturnValue('admin-refresh-token');
      (JwtUtil.buildAccessPayload as jest.Mock).mockReturnValue({
        companyId: mockAdminUser.companyId,
        id: mockAdminUser.id,
        email: mockAdminUser.email,
        role: mockAdminUser.role,
      });

      // When
      const result = await authService.adminRegister(validAdminInput);

      // Then
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('company');
      expect(result).toHaveProperty('accessToken', 'admin-access-token');
      expect(result).toHaveProperty('refreshToken', 'admin-refresh-token');
      expect(prisma.companies.create).toHaveBeenCalled();
      expect(prisma.budgetCriteria.create).toHaveBeenCalledWith({
        data: { companyId: mockCompany.id, amount: 0 },
      });
    });

    it('사업자 번호가 중복되면 에러를 던져야 합니다', async () => {
      // Given
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(prisma));
      (prisma.companies.findFirst as jest.Mock).mockResolvedValue(mockCompany);

      // When & Then
      await expect(authService.adminRegister(validAdminInput)).rejects.toThrow(CustomError);
    });
  });

  describe('login', () => {
    const validLoginInput = {
      email: 'test@example.com',
      password: 'password123!',
    };

    const mockUser = {
      id: 'user-id',
      companyId: 'company-id',
      email: 'test@example.com',
      name: '테스트 사용자',
      role: 'USER' as const,
      password: 'hashed-password',
      isActive: true,
      profileImage: null,
      companies: { name: '테스트회사' },
    };

    const anotherUser = {
      id: 'user-id-2',
      companyId: 'company-id-2',
      email: 'test@example.com',
      name: '테스트 사용자',
      role: 'USER' as const,
      password: 'hashed-password-2',
      isActive: true,
      profileImage: null,
      companies: { name: '두번째회사' },
    };

    const mockTokenResult = () => {
      (prisma.users.update as jest.Mock).mockResolvedValue({});
      (JwtUtil.generateAccessToken as jest.Mock).mockReturnValue('login-access-token');
      (JwtUtil.generateRefreshToken as jest.Mock).mockReturnValue('login-refresh-token');
      (JwtUtil.buildAccessPayload as jest.Mock).mockReturnValue({
        companyId: mockUser.companyId,
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    };

    it('정상적으로 로그인이 완료되어야 합니다', async () => {
      // Given
      (prisma.users.findMany as jest.Mock).mockResolvedValue([mockUser]);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      mockTokenResult();

      // When
      const result = await authService.login(validLoginInput);

      // Then
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'login-access-token');
      expect(result).toHaveProperty('refreshToken', 'login-refresh-token');
      expect(result.user.email).toBe(validLoginInput.email);
    });

    it('companyId가 있으면 해당 회사로 로그인되어야 합니다', async () => {
      // Given
      const input = { ...validLoginInput, companyId: mockUser.companyId };
      (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      mockTokenResult();

      // When
      const result = await authService.login(input);

      // Then
      expect(result).toHaveProperty('accessToken', 'login-access-token');
      expect(result.user.companyId).toBe(mockUser.companyId);
    });

    it('존재하지 않는 이메일이면 에러를 던져야 합니다', async () => {
      // Given
      (prisma.users.findMany as jest.Mock).mockResolvedValue([]);

      // When & Then
      await expect(authService.login(validLoginInput)).rejects.toThrow(CustomError);
    });

    it('companyId가 일치하지 않으면 에러를 던져야 합니다', async () => {
      // Given
      const input = { ...validLoginInput, companyId: 'unknown-company' };
      (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(authService.login(input)).rejects.toThrow(CustomError);
    });

    it('비밀번호가 틀리면 에러를 던져야 합니다', async () => {
      // Given
      (prisma.users.findMany as jest.Mock).mockResolvedValue([mockUser]);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      // When & Then
      await expect(authService.login(validLoginInput)).rejects.toThrow(CustomError);
    });

    it('비활성화된 계정이면 에러를 던져야 합니다', async () => {
      // Given
      const inactiveUser = { ...mockUser, isActive: false };
      (prisma.users.findMany as jest.Mock).mockResolvedValue([inactiveUser]);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);

      // When & Then
      await expect(authService.login(validLoginInput)).rejects.toThrow(CustomError);
    });

    it('여러 회사 계정이면 회사 선택이 필요합니다', async () => {
      // Given
      (prisma.users.findMany as jest.Mock).mockResolvedValue([mockUser, anotherUser]);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);

      // When & Then
      await expect(authService.login(validLoginInput)).rejects.toMatchObject({
        errorCode: ErrorCodes.AUTH_COMPANY_SELECTION_REQUIRED,
        statusCode: 409,
        details: {
          requiresCompanySelection: true,
          companies: expect.any(Array),
        },
      });
    });

    it('여러 회사 계정에서 비밀번호가 모두 틀리면 에러를 던져야 합니다', async () => {
      // Given
      (prisma.users.findMany as jest.Mock).mockResolvedValue([mockUser, anotherUser]);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      // When & Then
      await expect(authService.login(validLoginInput)).rejects.toMatchObject({
        errorCode: ErrorCodes.AUTH_INVALID_CREDENTIALS,
      });
    });
  });

  describe('refresh', () => {
    const mockRefreshToken = 'valid-refresh-token';
    const mockPayload = { id: 'user-id', jti: 'jwt-id' };

    const mockUser = {
      id: 'user-id',
      companyId: 'company-id',
      email: 'test@example.com',
      name: '테스트 사용자',
      role: 'USER' as const,
      refreshToken: 'hashed-refresh-token',
      isActive: true,
    };

    it('정상적으로 토큰이 갱신되어야 합니다', async () => {
      // Given
      (JwtUtil.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.users.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      (JwtUtil.generateAccessToken as jest.Mock).mockReturnValue('new-access-token');
      (JwtUtil.generateRefreshToken as jest.Mock).mockReturnValue('new-refresh-token');
      (JwtUtil.buildAccessPayload as jest.Mock).mockReturnValue({
        companyId: mockUser.companyId,
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });

      // When
      const result = await authService.refresh(mockRefreshToken);

      // Then
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
    });

    it('유효하지 않은 사용자면 에러를 던져야 합니다', async () => {
      // Given
      (JwtUtil.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(authService.refresh(mockRefreshToken)).rejects.toThrow(CustomError);
    });

    it('비활성화된 계정이면 에러를 던져야 합니다', async () => {
      // Given
      const inactiveUser = { ...mockUser, isActive: false };
      (JwtUtil.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(inactiveUser);

      // When & Then
      await expect(authService.refresh(mockRefreshToken)).rejects.toThrow(CustomError);
    });

    it('refresh token 검증 실패 시 기존 토큰을 무효화해야 합니다', async () => {
      // Given
      (JwtUtil.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);
      (prisma.users.updateMany as jest.Mock).mockResolvedValue({});

      // When & Then
      await expect(authService.refresh(mockRefreshToken)).rejects.toThrow(CustomError);
      expect(prisma.users.updateMany).toHaveBeenCalledWith({
        where: { id: mockUser.id, refreshToken: mockUser.refreshToken },
        data: { refreshToken: null },
      });
    });

    it('재사용 시도 시 모든 토큰을 무효화해야 합니다', async () => {
      // Given
      (JwtUtil.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      jest.spyOn(argon2, 'hash').mockResolvedValue('new-hashed-token' as never);
      (JwtUtil.generateAccessToken as jest.Mock).mockReturnValue('new-access-token');
      (JwtUtil.generateRefreshToken as jest.Mock).mockReturnValue('new-refresh-token');
      (JwtUtil.buildAccessPayload as jest.Mock).mockReturnValue({
        companyId: mockUser.companyId,
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      (prisma.users.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.users.update as jest.Mock).mockResolvedValue({});

      // When & Then
      await expect(authService.refresh(mockRefreshToken)).rejects.toThrow(CustomError);
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { refreshToken: null },
      });
    });
  });

  describe('logoutByToken', () => {
    const mockRefreshToken = 'valid-refresh-token';
    const mockPayload = { id: 'user-id' };

    it('정상적으로 로그아웃이 완료되어야 합니다', async () => {
      // Given
      (JwtUtil.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (prisma.users.update as jest.Mock).mockResolvedValue({});

      // When
      await authService.logoutByToken(mockRefreshToken);

      // Then
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: mockPayload.id },
        data: { refreshToken: null },
      });
    });

    it('유효하지 않은 토큰이어도 에러를 던지지 않아야 합니다', async () => {
      // Given
      (JwtUtil.verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // When & Then
      await expect(authService.logoutByToken(mockRefreshToken)).resolves.not.toThrow();
    });
  });
});
