import { Request, Response, NextFunction } from 'express';
import { validationResult, type FieldValidationError } from 'express-validator';
import { CustomError } from '../utils/error.util';
import { HttpStatus } from '../constants/httpStatus.constants';
import { ErrorCodes } from '../constants/errorCodes.constants';

export const validateRequest = (req: Request, _res: Response, next: NextFunction) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  // 요청 값 필드 중 민감한 정보 제거
  const safeDetails = result
    .array()
    .filter((e): e is FieldValidationError => e.type === 'field')
    .map(({ msg, path, location }) => ({
      msg: String(msg),
      path,
      location,
    }));

  throw new CustomError(
    HttpStatus.BAD_REQUEST,
    ErrorCodes.VAL_VALIDATION_ERROR,
    '요청 값이 올바르지 않습니다.',
    safeDetails
  );
};
