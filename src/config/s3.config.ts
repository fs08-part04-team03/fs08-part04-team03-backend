import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.config';

/**
 * AWS S3 클라이언트 설정
 * 이미지 업로드 및 조회를 위한 S3 클라이언트 인스턴스
 */
export const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * S3 버킷 이름
 */
export const S3_BUCKET_NAME = env.AWS_S3_BUCKET_NAME;

/**
 * 허용되는 이미지 MIME 타입
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/**
 * 최대 파일 크기 (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Presigned URL 만료 시간 (초)
 * 기본값: 3600초 (1시간)
 */
export const PRESIGNED_URL_EXPIRES_IN = 3600;

/**
 * S3에 저장될 파일 경로 생성
 * @param folder - 폴더명 (예: 'products', 'users', 'companies')
 * @param filename - 파일명
 * @returns S3 객체 키
 */
export const getS3Key = (folder: string, filename: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = filename.split('.').pop();
  return `${folder}/${timestamp}-${randomString}.${extension}`;
};

/**
 * S3 URL 생성
 * @param key - S3 객체 키
 * @returns S3 객체 URL
 */
export const getS3Url = (key: string): string =>
  `https://${S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
