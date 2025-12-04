import type { Location, ValidationError } from 'express-validator';

// 안전한 검증 상세 정보 타입
export type SafeValidationDetail = {
  msg: string;
  path: string;
  location: Location;
};

// 공통 에러 클래스
export class CustomError extends Error {
  public statusCode: number;

  public errorCode: string;

  public details: ValidationError[] | SafeValidationDetail[] | string | null;

  constructor(
    statusCode: number,
    errorCode: string,
    message: string,
    details: ValidationError[] | SafeValidationDetail[] | string | null = null
  ) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}
