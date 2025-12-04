import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { CustomError } from '../utils/error.util';
import { HttpStatus } from '../constants/httpStatus.constants';
import { ErrorCodes } from '../constants/errorCodes.constants';

export const validateRequest = (req: Request, _res: Response, next: NextFunction) => {
  const result = validationResult(req);

  // 검증 오류가 있으면 CustomError 던지기
  if (!result.isEmpty()) {
    throw new CustomError(
      HttpStatus.BAD_REQUEST,
      ErrorCodes.VAL_VALIDATION_ERROR,
      '요청 값이 올바르지 않습니다.',
      result.array()
    );
  }

  return next();
};
