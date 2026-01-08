import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { validateRequest } from './validator.middleware';
import { CustomError } from '../utils/error.util';
import { HttpStatus } from '../constants/httpStatus.constants';
import { ErrorCodes } from '../constants/errorCodes.constants';

// express-validator 모킹
jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

describe('Validator Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('validateRequest', () => {
    it('검증 오류가 없으면 다음 미들웨어로 진행해야 합니다', () => {
      // Given
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
        array: () => [],
      });

      // When
      validateRequest(mockRequest as Request, mockResponse as Response, nextFunction);

      // Then
      expect(nextFunction).toHaveBeenCalledWith();
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });

    it('검증 오류가 있으면 CustomError를 발생시켜야 합니다', () => {
      // Given
      const mockErrors = [
        {
          type: 'field' as const,
          path: 'email',
          msg: 'Invalid email format',
          value: 'invalid-email',
          location: 'body' as const,
        },
        {
          type: 'field' as const,
          path: 'password',
          msg: 'Password is required',
          value: '',
          location: 'body' as const,
        },
      ];

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors,
      });

      // When & Then
      try {
        validateRequest(mockRequest as Request, mockResponse as Response, nextFunction);
        // Fail the test if no error was thrown
        throw new Error('Expected CustomError to be thrown but no error was thrown.');
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
        const customError = error as CustomError;
        expect(customError.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(customError.errorCode).toBe(ErrorCodes.VAL_VALIDATION_ERROR);
        expect(customError.message).toBe('요청 값이 올바르지 않습니다.');
      }
    });

    it('검증 오류의 세부 정보를 포함해야 합니다', () => {
      // Given
      const mockErrors = [
        {
          type: 'field' as const,
          path: 'email',
          msg: 'Invalid email format',
          value: 'invalid-email',
          location: 'body' as const,
        },
      ];

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors,
      });

      // When
      try {
        validateRequest(mockRequest as Request, mockResponse as Response, nextFunction);
      } catch (error) {
        // Then
        expect(error).toBeInstanceOf(CustomError);
        const customError = error as CustomError;
        expect(customError.details).toEqual([
          {
            field: 'email',
            message: 'Invalid email format',
          },
        ]);
      }
    });

    it('여러 검증 오류를 모두 포함해야 합니다', () => {
      // Given
      const mockErrors = [
        {
          type: 'field' as const,
          path: 'email',
          msg: 'Invalid email',
          value: 'bad',
          location: 'body' as const,
        },
        {
          type: 'field' as const,
          path: 'password',
          msg: 'Too short',
          value: '123',
          location: 'body' as const,
        },
        {
          type: 'field' as const,
          path: 'name',
          msg: 'Required',
          value: '',
          location: 'body' as const,
        },
      ];

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors,
      });

      // When
      try {
        validateRequest(mockRequest as Request, mockResponse as Response, nextFunction);
      } catch (error) {
        // Then
        const customError = error as CustomError;
        expect(customError.details).toHaveLength(3);
        expect(customError.details).toEqual([
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Too short' },
          { field: 'name', message: 'Required' },
        ]);
      }
    });

    it('field 타입이 아닌 검증 오류는 필터링해야 합니다', () => {
      // Given
      const mockErrors = [
        {
          type: 'field' as const,
          path: 'email',
          msg: 'Invalid email',
          value: 'bad',
          location: 'body' as const,
        },
        {
          type: 'alternative' as const,
          msg: 'Alternative validation failed',
          nestedErrors: [],
        },
      ];

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors,
      });

      // When
      try {
        validateRequest(mockRequest as Request, mockResponse as Response, nextFunction);
      } catch (error) {
        // Then
        const customError = error as CustomError;
        expect(customError.details).toHaveLength(1);
        expect(customError.details).toEqual([{ field: 'email', message: 'Invalid email' }]);
      }
    });

    it('메시지를 문자열로 변환해야 합니다', () => {
      // Given
      const mockErrors = [
        {
          type: 'field' as const,
          path: 'age',
          msg: 42, // 숫자 메시지
          value: 'invalid',
          location: 'body' as const,
        },
      ];

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors,
      });

      // When
      try {
        validateRequest(mockRequest as Request, mockResponse as Response, nextFunction);
      } catch (error) {
        // Then
        const customError = error as CustomError;
        expect(customError.details).toEqual([{ field: 'age', message: '42' }]);
      }
    });
  });
});
