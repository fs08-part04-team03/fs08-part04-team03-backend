import { CustomError, type SafeValidationDetail } from './error.util';
import { HttpStatus } from '../constants/httpStatus.constants';
import { ErrorCodes } from '../constants/errorCodes.constants';

describe('Error Util', () => {
  describe('CustomError', () => {
    it('기본 에러를 생성해야 합니다', () => {
      // Given
      const statusCode = HttpStatus.BAD_REQUEST;
      const errorCode = ErrorCodes.GENERAL_BAD_REQUEST;
      const message = '잘못된 요청입니다.';

      // When
      const error = new CustomError(statusCode, errorCode, message);

      // Then
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CustomError);
      expect(error.name).toBe('CustomError');
      expect(error.statusCode).toBe(statusCode);
      expect(error.errorCode).toBe(errorCode);
      expect(error.message).toBe(message);
      expect(error.details).toBeNull();
    });

    it('문자열 details를 포함한 에러를 생성해야 합니다', () => {
      // Given
      const details = '상세 에러 정보';

      // When
      const error = new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_BAD_REQUEST,
        '에러 발생',
        details
      );

      // Then
      expect(error.details).toBe(details);
    });

    it('SafeValidationDetail 배열을 포함한 에러를 생성해야 합니다', () => {
      // Given
      const details: SafeValidationDetail[] = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' },
      ];

      // When
      const error = new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VAL_VALIDATION_ERROR,
        '검증 실패',
        details
      );

      // Then
      expect(error.details).toEqual(details);
      expect(Array.isArray(error.details)).toBe(true);
      expect(error.details).toHaveLength(2);
    });

    it('NOT_FOUND 에러를 생성해야 합니다', () => {
      // Given & When
      const error = new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        '리소스를 찾을 수 없습니다.'
      );

      // Then
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe(ErrorCodes.GENERAL_NOT_FOUND);
    });

    it('UNAUTHORIZED 에러를 생성해야 합니다', () => {
      // Given & When
      const error = new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '인증이 필요합니다.'
      );

      // Then
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe(ErrorCodes.AUTH_UNAUTHORIZED);
    });

    it('FORBIDDEN 에러를 생성해야 합니다', () => {
      // Given & When
      const error = new CustomError(
        HttpStatus.FORBIDDEN,
        ErrorCodes.AUTH_FORBIDDEN,
        '접근 권한이 없습니다.'
      );

      // Then
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe(ErrorCodes.AUTH_FORBIDDEN);
    });

    it('CONFLICT 에러를 생성해야 합니다', () => {
      // Given & When
      const error = new CustomError(
        HttpStatus.CONFLICT,
        ErrorCodes.DB_UNIQUE_CONSTRAINT_VIOLATION,
        '이미 존재하는 리소스입니다.'
      );

      // Then
      expect(error.statusCode).toBe(409);
      expect(error.errorCode).toBe(ErrorCodes.DB_UNIQUE_CONSTRAINT_VIOLATION);
    });

    it('INTERNAL_SERVER_ERROR 에러를 생성해야 합니다', () => {
      // Given & When
      const error = new CustomError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.GENERAL_INTERNAL_ERROR,
        '서버 오류가 발생했습니다.'
      );

      // Then
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe(ErrorCodes.GENERAL_INTERNAL_ERROR);
    });

    it('에러 스택을 포함해야 합니다', () => {
      // Given & When
      const error = new CustomError(HttpStatus.BAD_REQUEST, ErrorCodes.GENERAL_BAD_REQUEST, '에러');

      // Then
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('에러를 throw할 수 있어야 합니다', () => {
      // Given
      const error = new CustomError(HttpStatus.BAD_REQUEST, ErrorCodes.GENERAL_BAD_REQUEST, '에러');

      // When & Then
      expect(() => {
        throw error;
      }).toThrow(CustomError);
      expect(() => {
        throw error;
      }).toThrow('에러');
    });

    it('에러를 catch할 수 있어야 합니다', () => {
      // Given
      const error = new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        'Not found'
      );

      // When
      try {
        throw error;
      } catch (e) {
        // Then
        expect(e).toBeInstanceOf(CustomError);
        expect((e as CustomError).statusCode).toBe(404);
        expect((e as CustomError).errorCode).toBe(ErrorCodes.GENERAL_NOT_FOUND);
        expect((e as CustomError).message).toBe('Not found');
      }
    });
  });
});
