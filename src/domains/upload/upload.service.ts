import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { role } from '@prisma/client';
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
import { prisma } from '../../common/database/prisma.client';
import { UploadValidation } from './upload.validation';
import type { UploadedFileInfo, UploadFolder, CreateUploadDto } from './upload.types';

export const uploadService = {
  /**
   * 이미지를 S3에 업로드하고 DB에 메타데이터 저장
   * @param file - 업로드할 파일 (Multer에서 제공)
   * @param userId - 업로드하는 사용자 ID
   * @param companyId - 사용자가 속한 회사 ID
   * @param folder - 저장할 폴더 (기본값: 'misc')
   * @param productId - 상품 이미지인 경우 상품 ID (optional)
   * @returns 업로드된 파일 정보
   */
  async uploadImage(
    file: Express.Multer.File,
    userId: string,
    companyId: string,
    productId?: number,
    folder: UploadFolder = 'misc'
  ) {
    if (!file) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '업로드할 파일이 없습니다.'
      );
    }

    // 폴더명 검증
    UploadValidation.validateFolder(folder);

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

      // DB에 업로드 메타데이터 저장
      const uploadData: CreateUploadDto = {
        userId,
        companyId,
        productId: productId || null,
        key,
        folder,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };

      await prisma.uploads.create({
        data: uploadData,
      });

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
      // S3 업로드는 성공했지만 DB 저장에 실패한 경우, S3에서 파일 삭제 시도
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: key,
          })
        );
      } catch (deleteError) {
        // 삭제 실패는 로그만 남기고 무시 (원래 에러를 throw)
        console.error('S3 파일 정리 실패:', deleteError);
      }

      throw new CustomError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.GENERAL_INTERNAL_ERROR,
        `이미지 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  },

  /**
   * S3에서 이미지 URL 조회 (Signed URL 생성) with 접근 제어
   * @param key - S3 객체 키
   * @param userId - 요청하는 사용자 ID
   * @param userRole - 사용자 역할
   * @param userCompanyId - 사용자 회사 ID
   * @param isDownload - 다운로드 모드 (true: 파일 다운로드, false: 브라우저에 표시)
   * @returns Signed URL (1시간 유효)
   */
  async getImageUrl(
    key: string,
    userId: string,
    userRole: string,
    userCompanyId: string,
    isDownload: boolean = false
  ) {
    // S3 키 형식 검증 (경로 순회 공격 방지)
    UploadValidation.validateS3Key(key);

    try {
      // DB에서 파일 정보 조회
      const upload = await prisma.uploads.findUnique({
        where: { key },
      });

      if (!upload) {
        throw new CustomError(
          HttpStatus.NOT_FOUND,
          ErrorCodes.GENERAL_NOT_FOUND,
          '이미지를 찾을 수 없습니다.'
        );
      }

      // 접근 제어: 파일 소유자 또는 같은 회사의 MANAGER 이상만 접근 가능
      const isOwner = upload.userId === userId;
      const isSameCompany = upload.companyId === userCompanyId;
      const isManagerOrAbove = userRole === role.MANAGER || userRole === role.ADMIN;

      if (!isOwner && !(isSameCompany && isManagerOrAbove)) {
        throw new CustomError(
          HttpStatus.FORBIDDEN,
          ErrorCodes.AUTH_FORBIDDEN,
          '이 파일에 접근할 권한이 없습니다.'
        );
      }

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
        const filename = upload.originalName || key.split('/').pop() || 'download';
        // ASCII 파일명과 UTF-8 인코딩된 파일명 모두 제공 (RFC 5987)
        const asciiFilename = filename.replace(/[^\x20-\x7E]/g, '_');
        const encodedFilename = encodeURIComponent(filename);
        commandParams.ResponseContentDisposition = `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`;
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
      // CustomError는 그대로 throw
      if (error instanceof CustomError) {
        throw error;
      }

      // 기타 에러 처리
      throw new CustomError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.GENERAL_INTERNAL_ERROR,
        `이미지 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  },

  /**
   * S3에서 이미지 삭제 with 접근 제어
   * @param key - S3 객체 키
   * @param userId - 요청하는 사용자 ID
   * @param userRole - 사용자 역할
   * @param userCompanyId - 사용자 회사 ID
   */
  async deleteImage(key: string, userId: string, userRole: string, userCompanyId: string) {
    // S3 키 형식 검증 (경로 순회 공격 방지)
    UploadValidation.validateS3Key(key);

    try {
      // DB에서 파일 정보 조회
      const upload = await prisma.uploads.findUnique({
        where: { key },
      });

      if (!upload) {
        throw new CustomError(
          HttpStatus.NOT_FOUND,
          ErrorCodes.GENERAL_NOT_FOUND,
          '이미지를 찾을 수 없습니다.'
        );
      }

      // 접근 제어: 파일 소유자 또는 같은 회사의 MANAGER 이상만 삭제 가능
      const isOwner = upload.userId === userId;
      const isSameCompany = upload.companyId === userCompanyId;
      const isManagerOrAbove = userRole === role.MANAGER || userRole === role.ADMIN;

      if (!isOwner && !(isSameCompany && isManagerOrAbove)) {
        throw new CustomError(
          HttpStatus.FORBIDDEN,
          ErrorCodes.AUTH_FORBIDDEN,
          '이 파일을 삭제할 권한이 없습니다.'
        );
      }

      // S3에서 파일 삭제
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);

      // DB에서 메타데이터 삭제
      await prisma.uploads.delete({
        where: { key },
      });

      return ResponseUtil.success(null, '이미지가 삭제되었습니다.');
    } catch (error) {
      // CustomError는 그대로 throw
      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.GENERAL_INTERNAL_ERROR,
        `이미지 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  },
};
