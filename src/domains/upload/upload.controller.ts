import { Request, Response } from 'express';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { uploadService } from './upload.service';
import type { UploadImageQuery, GetImageQuery } from './upload.types';

export const uploadController = {
  /**
   * 이미지 업로드 (POST)
   * - 단일 이미지를 S3에 업로드
   * - 쿼리 파라미터로 폴더 지정 가능 (기본값: 'misc')
   */
  uploadImage: async (req: Request, res: Response) => {
    const { folder = 'misc' } = req.query as UploadImageQuery;

    if (!req.file) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '업로드할 이미지 파일이 없습니다.'
      );
    }

    const result = await uploadService.uploadImage(req.file, folder);
    res.status(HttpStatus.CREATED).json(result);
  },

  /**
   * 여러 이미지 업로드 (POST)
   * - 여러 이미지를 S3에 업로드 (최대 10개)
   * - 쿼리 파라미터로 폴더 지정 가능 (기본값: 'misc')
   */
  uploadMultipleImages: async (req: Request, res: Response) => {
    const { folder = 'misc' } = req.query as UploadImageQuery;

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '업로드할 이미지 파일이 없습니다.'
      );
    }

    const uploadPromises = req.files.map((file) => uploadService.uploadImage(file, folder));

    const results = await Promise.all(uploadPromises);

    res.status(HttpStatus.CREATED).json({
      success: true,
      data: results.map((r) => r.data),
      message: `${req.files.length}개의 이미지 업로드가 완료되었습니다.`,
    });
  },

  /**
   * 이미지 URL 조회 (GET)
   * - S3에 저장된 이미지의 Signed URL 반환
   * - URL 파라미터로 S3 키 전달 (URL 인코딩 필요)
   * - 쿼리 파라미터 download=true로 다운로드 모드 활성화 가능
   */
  getImageUrl: async (req: Request, res: Response) => {
    const { key } = req.params as { key: string };
    const { download } = req.query as GetImageQuery;

    if (!key) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '이미지 키가 필요합니다.'
      );
    }

    // URL 디코딩
    const decodedKey = decodeURIComponent(key);

    // download 쿼리 파라미터 확인
    const isDownload = download === 'true';

    const result = await uploadService.getImageUrl(decodedKey, isDownload);
    res.status(HttpStatus.OK).json(result);
  },

  /**
   * 이미지 삭제 (DELETE)
   * - S3에서 이미지 삭제
   * - URL 파라미터로 S3 키 전달 (URL 인코딩 필요)
   */
  deleteImage: async (req: Request, res: Response) => {
    const { key } = req.params as { key: string };

    if (!key) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '이미지 키가 필요합니다.'
      );
    }

    // URL 디코딩
    const decodedKey = decodeURIComponent(key);

    const result = await uploadService.deleteImage(decodedKey);
    res.status(HttpStatus.OK).json(result);
  },
};
