import multer from 'multer';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '../../config/s3.config';

/**
 * 파일 필터: 이미지 파일만 허용
 */
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    cb(null, true);
  } else {
    cb(
      new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        `지원하지 않는 파일 형식입니다. 허용되는 형식: ${ALLOWED_IMAGE_TYPES.join(', ')}`
      )
    );
  }
};

/**
 * Multer 설정
 * - 메모리 스토리지 사용 (파일을 버퍼로 저장)
 * - 파일 크기 제한: 5MB
 * - 이미지 파일만 허용
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * 단일 이미지 업로드 미들웨어
 * 필드명: 'image'
 */
export const uploadSingleImage = upload.single('image');

/**
 * 다중 이미지 업로드 미들웨어 (최대 10개)
 * 필드명: 'images'
 */
export const uploadMultipleImages = upload.array('images', 10);
