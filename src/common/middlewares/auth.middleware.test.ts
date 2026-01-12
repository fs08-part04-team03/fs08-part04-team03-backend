import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './auth.middleware';
import { JwtUtil } from '../utils/jwt.util';
import { HttpStatus } from '../constants/httpStatus.constants';
import { ErrorCodes } from '../constants/errorCodes.constants';
import type { AuthenticatedRequest, AuthTokenPayload } from '../types/common.types';

// JwtUtil 모킹
jest.mock('../utils/jwt.util');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('verifyAccessToken', () => {
    const mockPayload: AuthTokenPayload = {
      id: 'user-123',
      companyId: 'company-123',
      email: 'test@example.com',
      role: 'USER',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    it('유효한 토큰으로 인증에 성공해야 합니다', () => {
      // Given
      const validToken = 'valid-access-token';
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      (JwtUtil.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

      // When
      verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      // Then
      expect(JwtUtil.verifyAccessToken).toHaveBeenCalledWith(validToken);
      expect((mockRequest as AuthenticatedRequest).user).toEqual(mockPayload);
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('Authorization 헤더가 없으면 에러를 발생시켜야 합니다', () => {
      // Given
      mockRequest.headers = {};

      // When
      verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCodes.AUTH_UNAUTHORIZED,
          message: 'Authorization header is missing',
        })
      );
    });

    it('Bearer 형식이 아니면 에러를 발생시켜야 합니다', () => {
      // Given
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      // When
      verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCodes.GENERAL_BAD_REQUEST,
          message: 'Invalid Authorization header format',
        })
      );
    });

    it('토큰이 없으면 에러를 발생시켜야 합니다', () => {
      // Given
      mockRequest.headers = {
        authorization: 'Bearer  ',
      };

      // When
      verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: ErrorCodes.AUTH_UNAUTHORIZED,
          message: 'Bearer token is missing',
        })
      );
    });

    it('토큰 검증 실패 시 에러를 전달해야 합니다', () => {
      // Given
      const invalidToken = 'invalid-token';
      mockRequest.headers = {
        authorization: `Bearer ${invalidToken}`,
      };

      const jwtError = new Error('Invalid token');
      (JwtUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw jwtError;
      });

      // When
      verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith(jwtError);
    });

    it('만료된 토큰 시 에러를 전달해야 합니다', () => {
      // Given
      const expiredToken = 'expired-token';
      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      const tokenExpiredError = new Error('Token expired');
      tokenExpiredError.name = 'TokenExpiredError';
      (JwtUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw tokenExpiredError;
      });

      // When
      verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith(tokenExpiredError);
    });

    it('Bearer 토큰에 공백이 포함되면 에러를 발생시켜야 합니다', () => {
      // Given
      const tokenWithSpaces = 'token with spaces';
      mockRequest.headers = {
        authorization: `Bearer ${tokenWithSpaces}`,
      };

      // When
      verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCodes.GENERAL_BAD_REQUEST,
          message: 'Bearer token must not contain whitespace',
        })
      );
      expect(JwtUtil.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should allow tabs/spaces between Bearer and token', () => {
      // Given
      const validToken = 'valid-access-token';
      mockRequest.headers = {
        authorization: `Bearer\t   ${validToken}`,
      };

      (JwtUtil.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

      // When
      verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction);

      // Then
      expect(JwtUtil.verifyAccessToken).toHaveBeenCalledWith(validToken);
      expect(nextFunction).toHaveBeenCalledWith();
    });
  });
});
