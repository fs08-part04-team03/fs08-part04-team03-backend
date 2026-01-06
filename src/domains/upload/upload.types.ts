/**
 * 업로드 폴더 타입
 */
export type UploadFolder = 'products' | 'users' | 'companies' | 'misc';

/**
 * 업로드된 파일 정보
 */
export interface UploadedFileInfo {
  /**
   * S3에 저장된 파일 키
   */
  key: string;

  /**
   * 파일의 공개 URL
   */
  url: string;

  /**
   * Presigned URL (임시 접근 URL, 1시간 유효)
   */
  signedUrl: string;

  /**
   * Presigned URL 만료 시간 (초)
   */
  expiresIn: number;

  /**
   * 원본 파일명
   */
  originalName: string;

  /**
   * 파일 크기 (bytes)
   */
  size: number;

  /**
   * MIME 타입
   */
  mimeType: string;
}

/**
 * 이미지 업로드 요청 쿼리
 */
export interface UploadImageQuery {
  /**
   * 업로드할 폴더
   */
  folder?: UploadFolder;
}

/**
 * 이미지 조회 요청 파라미터
 */
export interface GetImageParams {
  /**
   * S3 객체 키 (URL 인코딩된 값)
   */
  key: string;
}

/**
 * 이미지 조회 요청 쿼리
 */
export interface GetImageQuery {
  /**
   * 다운로드 모드 활성화 (true: 파일 다운로드, false: 브라우저에 표시)
   */
  download?: 'true' | 'false' | boolean;
}

/**
 * DB에 저장되는 업로드 정보
 */
export interface UploadEntity {
  id: string;
  userId: string;
  companyId: string;
  productId?: number | null;
  key: string;
  folder: UploadFolder;
  originalName: string;
  size: number;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 업로드 생성 DTO
 */
export interface CreateUploadDto {
  userId: string;
  companyId: string;
  productId?: number | null;
  key: string;
  folder: UploadFolder;
  originalName: string;
  size: number;
  mimeType: string;
}
