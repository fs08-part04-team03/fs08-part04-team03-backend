import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import type { UploadFolder } from './upload.types';

/**
 * S3 키 검증 유틸리티
 * 경로 순회(path traversal) 공격 방지
 */
export class UploadValidation {
  /**
   * 허용되는 폴더 목록
   */
  private static readonly ALLOWED_FOLDERS: UploadFolder[] = [
    'products',
    'users',
    'companies',
    'misc',
  ];

  /**
   * 위험한 패턴 목록 (경로 순회 공격 패턴)
   */
  private static readonly DANGEROUS_PATTERNS = [
    /\.\./g, // 상위 디렉토리 접근
    /\/\//g, // 중복 슬래시
    /^\//g, // 절대 경로
    /~/, // 홈 디렉토리
    /\\/g, // 백슬래시
    /\0/g, // null byte
    /%2e%2e/gi, // URL 인코딩된 ..
    /%2f%2f/gi, // URL 인코딩된 //
    /%5c/gi, // URL 인코딩된 \
  ];

  /**
   * S3 키 형식 검증
   * @param key - 검증할 S3 키
   * @throws CustomError - 유효하지 않은 키인 경우
   */
  static validateS3Key(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '유효하지 않은 파일 키입니다.'
      );
    }

    // URL 디코딩
    let decodedKey: string;
    try {
      decodedKey = decodeURIComponent(key);
    } catch {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '잘못된 형식의 파일 키입니다.'
      );
    }

    // 위험한 패턴 검사
    const hasDangerousPattern = this.DANGEROUS_PATTERNS.some((pattern) => pattern.test(decodedKey));
    if (hasDangerousPattern) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '허용되지 않는 파일 경로입니다.'
      );
    }

    // 폴더 형식 검증 (folder/filename 형식이어야 함)
    const parts = decodedKey.split('/');
    if (parts.length !== 2) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '잘못된 파일 경로 형식입니다. (폴더/파일명 형식이어야 합니다)'
      );
    }

    const [folder, filename] = parts;

    // 폴더명 검증
    if (!this.ALLOWED_FOLDERS.includes(folder as UploadFolder)) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        `허용되지 않는 폴더입니다. 허용되는 폴더: ${this.ALLOWED_FOLDERS.join(', ')}`
      );
    }

    // 파일명 검증 (빈 문자열이 아니어야 함)
    if (!filename || filename.trim().length === 0) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '파일명이 유효하지 않습니다.'
      );
    }

    // 파일명에 위험한 문자 검사
    // eslint-disable-next-line no-control-regex
    const dangerousChars = /[<>:"|?*\x00-\x1f]/g;
    if (dangerousChars.test(filename)) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '파일명에 허용되지 않는 문자가 포함되어 있습니다.'
      );
    }
  }

  /**
   * 폴더명 검증
   * @param folder - 검증할 폴더명
   * @throws CustomError - 유효하지 않은 폴더명인 경우
   */
  static validateFolder(folder: string): UploadFolder {
    if (!this.ALLOWED_FOLDERS.includes(folder as UploadFolder)) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        `허용되지 않는 폴더입니다. 허용되는 폴더: ${this.ALLOWED_FOLDERS.join(', ')}`
      );
    }
    return folder as UploadFolder;
  }
}
