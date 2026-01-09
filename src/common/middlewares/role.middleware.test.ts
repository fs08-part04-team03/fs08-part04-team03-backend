import { Response, NextFunction } from 'express';
import { requireAuth, requireRoles, requireMinRole } from './role.middleware';
import { HttpStatus } from '../constants/httpStatus.constants';
import { ErrorCodes } from '../constants/errorCodes.constants';
import type { AuthenticatedRequest, AuthTokenPayload } from '../types/common.types';

describe('Role Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  const mockUserPayload: AuthTokenPayload = {
    id: 'user-123',
    companyId: 'company-123',
    email: 'user@example.com',
    role: 'USER',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const mockManagerPayload: AuthTokenPayload = {
    ...mockUserPayload,
    id: 'manager-123',
    email: 'manager@example.com',
    role: 'MANAGER',
  };

  const mockAdminPayload: AuthTokenPayload = {
    ...mockUserPayload,
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'ADMIN',
  };

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('인증된 사용자는 통과해야 합니다', () => {
      // Given
      mockRequest.user = mockUserPayload;
      const middleware = requireAuth();

      // When
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('인증되지 않은 사용자는 에러를 발생시켜야 합니다', () => {
      // Given
      mockRequest.user = undefined;
      const middleware = requireAuth();

      // When
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCodes.AUTH_UNAUTHORIZED,
          message: 'Authentication required',
        })
      );
    });
  });

  describe('requireRoles', () => {
    it('허용된 역할을 가진 사용자는 통과해야 합니다', () => {
      // Given
      mockRequest.user = mockUserPayload;
      const middleware = requireRoles('USER', 'MANAGER');

      // When
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('허용되지 않은 역할을 가진 사용자는 거부해야 합니다', () => {
      // Given
      mockRequest.user = mockUserPayload;
      const middleware = requireRoles('ADMIN');

      // When
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.FORBIDDEN,
          errorCode: ErrorCodes.AUTH_FORBIDDEN,
          message: 'Forbidden',
        })
      );
    });

    it('인증되지 않은 사용자는 에러를 발생시켜야 합니다', () => {
      // Given
      mockRequest.user = undefined;
      const middleware = requireRoles('USER');

      // When
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCodes.AUTH_UNAUTHORIZED,
        })
      );
    });

    it('여러 역할 중 하나를 가진 사용자는 통과해야 합니다', () => {
      // Given
      mockRequest.user = mockManagerPayload;
      const middleware = requireRoles('MANAGER', 'ADMIN');

      // When
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith();
    });
  });

  describe('requireMinRole', () => {
    it('USER 이상의 권한을 가진 모든 사용자는 통과해야 합니다', () => {
      // Given - USER
      mockRequest.user = mockUserPayload;
      const middleware = requireMinRole('USER');

      // When
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith();

      // Given - MANAGER
      jest.clearAllMocks();
      mockRequest.user = mockManagerPayload;

      // When
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith();

      // Given - ADMIN
      jest.clearAllMocks();
      mockRequest.user = mockAdminPayload;

      // When
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('MANAGER 이상의 권한을 가진 사용자는 통과해야 합니다', () => {
      // Given - MANAGER
      mockRequest.user = mockManagerPayload;
      const middleware = requireMinRole('MANAGER');

      // When
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith();

      // Given - ADMIN
      jest.clearAllMocks();
      mockRequest.user = mockAdminPayload;

      // When
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('USER는 MANAGER 권한이 필요한 곳에 접근할 수 없어야 합니다', () => {
      // Given
      mockRequest.user = mockUserPayload;
      const middleware = requireMinRole('MANAGER');

      // When
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.FORBIDDEN,
          errorCode: ErrorCodes.AUTH_FORBIDDEN,
        })
      );
    });

    it('MANAGER는 ADMIN 권한이 필요한 곳에 접근할 수 없어야 합니다', () => {
      // Given
      mockRequest.user = mockManagerPayload;
      const middleware = requireMinRole('ADMIN');

      // When
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.FORBIDDEN,
          errorCode: ErrorCodes.AUTH_FORBIDDEN,
        })
      );
    });

    it('인증되지 않은 사용자는 에러를 발생시켜야 합니다', () => {
      // Given
      mockRequest.user = undefined;
      const middleware = requireMinRole('USER');

      // When
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCodes.AUTH_UNAUTHORIZED,
        })
      );
    });

    it('ADMIN 이상의 권한을 가진 사용자만 통과해야 합니다', () => {
      // Given
      mockRequest.user = mockAdminPayload;
      const middleware = requireMinRole('ADMIN');

      // When
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith();
    });
  });
});
