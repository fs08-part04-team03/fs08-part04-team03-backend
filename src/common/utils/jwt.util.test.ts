import jwt from 'jsonwebtoken';
import { JwtUtil } from './jwt.util';
import { CustomError } from './error.util';

// jwt.config 모킹
jest.mock('../../config/jwt.config', () => ({
  jwtConfig: {
    accessToken: {
      secret: 'test-access-secret',
      expiresIn: '15m',
    },
    refreshToken: {
      secret: 'test-refresh-secret',
      expiresIn: '7d',
    },
  },
}));

describe('JwtUtil', () => {
  describe('buildAccessPayload', () => {
    it('사용자 정보로부터 access token payload를 생성해야 합니다', () => {
      // Given
      const user = {
        id: 'user-id',
        companyId: 'company-id',
        email: 'test@example.com',
        role: 'USER' as const,
      };

      // When
      const payload = JwtUtil.buildAccessPayload(user);

      // Then
      expect(payload).toEqual({
        id: 'user-id',
        companyId: 'company-id',
        email: 'test@example.com',
        role: 'USER',
      });
    });
  });

  describe('generateAccessToken', () => {
    it('유효한 access token을 생성해야 합니다', () => {
      // Given
      const payload = {
        id: 'user-id',
        companyId: 'company-id',
        email: 'test@example.com',
        role: 'USER' as const,
      };

      // When
      const token = JwtUtil.generateAccessToken(payload);

      // Then
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      // 토큰 검증
      const decoded = jwt.verify(token, 'test-access-secret') as typeof payload;
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
    });
  });

  describe('verifyAccessToken', () => {
    it('유효한 access token을 검증해야 합니다', () => {
      // Given
      const payload = {
        id: 'user-id',
        companyId: 'company-id',
        email: 'test@example.com',
        role: 'USER' as const,
      };
      const token = jwt.sign(payload, 'test-access-secret', { expiresIn: '15m' });

      // When
      const decoded = JwtUtil.verifyAccessToken(token);

      // Then
      expect(decoded.id).toBe(payload.id);
      expect(decoded.companyId).toBe(payload.companyId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('만료된 토큰이면 에러를 던져야 합니다', () => {
      // Given
      const payload = {
        id: 'user-id',
        companyId: 'company-id',
        email: 'test@example.com',
        role: 'USER' as const,
      };
      const expiredToken = jwt.sign(payload, 'test-access-secret', { expiresIn: '-1s' });

      // When & Then
      expect(() => JwtUtil.verifyAccessToken(expiredToken)).toThrow(CustomError);
    });

    it('유효하지 않은 서명의 토큰이면 에러를 던져야 합니다', () => {
      // Given
      const payload = {
        id: 'user-id',
        companyId: 'company-id',
        email: 'test@example.com',
        role: 'USER' as const,
      };
      const invalidToken = jwt.sign(payload, 'wrong-secret', { expiresIn: '15m' });

      // When & Then
      expect(() => JwtUtil.verifyAccessToken(invalidToken)).toThrow(CustomError);
    });

    it('잘못된 페이로드 구조면 에러를 던져야 합니다', () => {
      // Given
      const invalidPayload = { someField: 'value' };
      const token = jwt.sign(invalidPayload, 'test-access-secret', { expiresIn: '15m' });

      // When & Then
      expect(() => JwtUtil.verifyAccessToken(token)).toThrow(CustomError);
    });

    it('잘못된 role 값이면 에러를 던져야 합니다', () => {
      // Given
      const invalidPayload = {
        id: 'user-id',
        companyId: 'company-id',
        email: 'test@example.com',
        role: 'INVALID_ROLE',
      };
      const token = jwt.sign(invalidPayload, 'test-access-secret', { expiresIn: '15m' });

      // When & Then
      expect(() => JwtUtil.verifyAccessToken(token)).toThrow(CustomError);
    });
  });

  describe('generateRefreshToken', () => {
    it('유효한 refresh token을 생성해야 합니다', () => {
      // Given
      const payload = {
        id: 'user-id',
        jti: 'jwt-id',
      };

      // When
      const token = JwtUtil.generateRefreshToken(payload);

      // Then
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      // 토큰 검증
      const decoded = jwt.verify(token, 'test-refresh-secret') as typeof payload;
      expect(decoded.id).toBe(payload.id);
      expect(decoded.jti).toBe(payload.jti);
    });
  });

  describe('verifyRefreshToken', () => {
    it('유효한 refresh token을 검증해야 합니다', () => {
      // Given
      const payload = {
        id: 'user-id',
        jti: 'jwt-id',
      };
      const token = jwt.sign(payload, 'test-refresh-secret', { expiresIn: '7d' });

      // When
      const decoded = JwtUtil.verifyRefreshToken(token);

      // Then
      expect(decoded.id).toBe(payload.id);
      expect(decoded.jti).toBe(payload.jti);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('만료된 토큰이면 에러를 던져야 합니다', () => {
      // Given
      const payload = {
        id: 'user-id',
        jti: 'jwt-id',
      };
      const expiredToken = jwt.sign(payload, 'test-refresh-secret', { expiresIn: '-1s' });

      // When & Then
      expect(() => JwtUtil.verifyRefreshToken(expiredToken)).toThrow(CustomError);
    });

    it('유효하지 않은 서명의 토큰이면 에러를 던져야 합니다', () => {
      // Given
      const payload = {
        id: 'user-id',
        jti: 'jwt-id',
      };
      const invalidToken = jwt.sign(payload, 'wrong-secret', { expiresIn: '7d' });

      // When & Then
      expect(() => JwtUtil.verifyRefreshToken(invalidToken)).toThrow(CustomError);
    });

    it('잘못된 페이로드 구조면 에러를 던져야 합니다', () => {
      // Given
      const invalidPayload = { someField: 'value' };
      const token = jwt.sign(invalidPayload, 'test-refresh-secret', { expiresIn: '7d' });

      // When & Then
      expect(() => JwtUtil.verifyRefreshToken(token)).toThrow(CustomError);
    });
  });
});
