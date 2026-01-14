import type { ValidationError } from 'express-validator';

// 안전한 검증 상세 정보 타입
export type SafeValidationDetail = {
  field: string;
  message: string;
};

// validation 외 상세 정보를 전달 가능
export type ErrorDetails =
  | ValidationError[]
  | SafeValidationDetail[]
  | Record<string, unknown>
  | string
  | null;

// 공통 에러 클래스
export class CustomError extends Error {
  public statusCode: number;

  public errorCode: string;

  public details: ErrorDetails;

  constructor(
    statusCode: number,
    errorCode: string,
    message: string,
    details: ErrorDetails = null
  ) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}
