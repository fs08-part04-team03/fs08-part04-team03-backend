import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  s3Client,
  S3_BUCKET_NAME,
  getS3Key,
  getS3Url,
  PRESIGNED_URL_EXPIRES_IN,
} from '../../config/s3.config';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import { ResponseUtil } from '../../common/utils/response.util';
import type { UploadedFileInfo, UploadFolder } from './upload.types';

export const uploadService = {
  /**
   * 이미지를 S3에 업로드
   * @param file - 업로드할 파일 (Multer에서 제공)
   * @param folder - 저장할 폴더 (기본값: 'misc')
   * @returns 업로드된 파일 정보
   */
  async uploadImage(file: Express.Multer.File, folder: UploadFolder = 'misc') {
    if (!file) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '업로드할 파일이 없습니다.'
      );
    }

    // S3 키 생성 (폴더/타임스탬프-랜덤문자열.확장자)
    const key = getS3Key(folder, file.originalname);

    try {
      // S3에 파일 업로드
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL을 설정하지 않고 버킷 정책으로 공개 읽기 허용
        // 또는 필요시 ServerSideEncryption, CacheControl 등 추가 가능
      });

      await s3Client.send(command);

      // Presigned URL 생성 (1시간 유효)
      const getCommand = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });
      const signedUrl = await getSignedUrl(s3Client, getCommand, {
        expiresIn: PRESIGNED_URL_EXPIRES_IN,
      });

      // 업로드된 파일 정보 반환
      const fileInfo: UploadedFileInfo = {
        key,
        url: getS3Url(key),
        signedUrl,
        expiresIn: PRESIGNED_URL_EXPIRES_IN,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };

      return ResponseUtil.success(fileInfo, '이미지 업로드가 완료되었습니다.');
    } catch (error) {
      throw new CustomError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.GENERAL_INTERNAL_ERROR,
        `S3 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  },

  /**
   * S3에서 이미지 URL 조회 (Signed URL 생성)
   * @param key - S3 객체 키
   * @param isDownload - 다운로드 모드 (true: 파일 다운로드, false: 브라우저에 표시)
   * @returns Signed URL (1시간 유효)
   */
  async getImageUrl(key: string, isDownload: boolean = false) {
    try {
      // 파일 존재 여부 확인
      const headCommand = new HeadObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(headCommand);

      // Signed URL 생성 (1시간 유효)
      const commandParams: {
        Bucket: string;
        Key: string;
        ResponseContentDisposition?: string;
      } = {
        Bucket: S3_BUCKET_NAME,
        Key: key,
      };

      // 다운로드 모드일 경우 Content-Disposition 헤더 추가
      if (isDownload) {
        const filename = key.split('/').pop() || 'download';
        commandParams.ResponseContentDisposition = `attachment; filename="${filename}"`;
      }

      const command = new GetObjectCommand(commandParams);

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: PRESIGNED_URL_EXPIRES_IN,
      });

      return ResponseUtil.success(
        {
          key,
          url: signedUrl,
          expiresIn: PRESIGNED_URL_EXPIRES_IN,
        },
        '이미지 URL을 조회했습니다.'
      );
    } catch (error: unknown) {
      // S3 에러 처리
      if (error && typeof error === 'object' && 'name' in error && error.name === 'NotFound') {
        throw new CustomError(
          HttpStatus.NOT_FOUND,
          ErrorCodes.GENERAL_NOT_FOUND,
          '이미지를 찾을 수 없습니다.'
        );
      }

      throw new CustomError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.GENERAL_INTERNAL_ERROR,
        `이미지 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  },

  /**
   * S3에서 이미지 삭제
   * @param key - S3 객체 키
   */
  async deleteImage(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);

      return ResponseUtil.success(null, '이미지가 삭제되었습니다.');
    } catch (error) {
      throw new CustomError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.GENERAL_INTERNAL_ERROR,
        `이미지 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  },
};
