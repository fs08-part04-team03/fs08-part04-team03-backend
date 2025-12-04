import type { ValidationError } from 'express-validator';

// 공통 에러 클래스
export class CustomError extends Error {
  public statusCode: number;

  public errorCode: string;

  public details: ValidationError[] | string | null;

  constructor(
    statusCode: number,
    errorCode: string,
    message: string,
    details: ValidationError[] | string | null = null
  ) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}
