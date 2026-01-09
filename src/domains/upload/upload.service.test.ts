import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '@/common/database/prisma.client';
import { CustomError } from '@/common/utils/error.util';
import { s3Client, PRESIGNED_URL_EXPIRES_IN } from '@/config/s3.config';
import { uploadService } from './upload.service';

interface Uploads {
  id: number;
  userId: string;
  companyId: string;
  productId: number | null;
  key: string;
  folder: string;
  originalName: string;
  size: number;
  mimeType: string;
  createdAt: Date;
}

// Mock dependencies
jest.mock('@/config/s3.config', () => ({
  s3Client: {
    send: jest.fn(),
  },
  S3_BUCKET_NAME: 'test-bucket',
  PRESIGNED_URL_EXPIRES_IN: 3600,
  getS3Key: jest.fn((folder: string, originalName: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = originalName.split('.').pop();
    return `${folder}/${timestamp}-${random}.${ext}`;
  }),
  getS3Url: jest.fn((key: string) => `https://test-bucket.s3.amazonaws.com/${key}`),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock('@/common/database/prisma.client', () => ({
  prisma: {
    uploads: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('UploadService', () => {
  const mockUserId = 'user-123';
  const mockCompanyId = 'company-123';
  const mockFile: Express.Multer.File = {
    fieldname: 'image',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('test-image-data'),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('이미지를 S3에 업로드하고 DB에 메타데이터를 저장해야 합니다', async () => {
      // Given
      const mockSignedUrl = 'https://signed-url.example.com/test.jpg';
      (s3Client.send as jest.Mock).mockResolvedValueOnce({}); // PutObjectCommand
      (prisma.uploads.create as jest.Mock).mockResolvedValueOnce({
        id: 1,
        userId: mockUserId,
        companyId: mockCompanyId,
        productId: null,
        key: 'misc/test.jpg',
        folder: 'misc',
        originalName: 'test.jpg',
        size: 1024,
        mimeType: 'image/jpeg',
        createdAt: new Date(),
      });
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockSignedUrl);

      // When
      const result = await uploadService.uploadImage(mockFile, mockUserId, mockCompanyId);

      // Then
      expect(s3Client.send).toHaveBeenCalledTimes(1);
      expect(prisma.uploads.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          companyId: mockCompanyId,
          productId: null,
          folder: 'misc',
          originalName: 'test.jpg',
          size: 1024,
          mimeType: 'image/jpeg',
        }),
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('signedUrl', mockSignedUrl);
      expect(result.data).toHaveProperty('expiresIn', PRESIGNED_URL_EXPIRES_IN);
    });

    it('productId가 제공되면 DB에 저장해야 합니다', async () => {
      // Given
      const productId = 100;
      const mockSignedUrl = 'https://signed-url.example.com/test.jpg';
      (s3Client.send as jest.Mock).mockResolvedValueOnce({}); // PutObjectCommand
      (prisma.uploads.create as jest.Mock).mockResolvedValueOnce({
        id: 1,
        userId: mockUserId,
        companyId: mockCompanyId,
        productId,
        key: 'products/test.jpg',
        folder: 'products',
        originalName: 'test.jpg',
        size: 1024,
        mimeType: 'image/jpeg',
        createdAt: new Date(),
      });
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockSignedUrl);

      // When
      await uploadService.uploadImage(mockFile, mockUserId, mockCompanyId, productId, 'products');

      // Then
      expect(prisma.uploads.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId,
          folder: 'products',
        }),
      });
    });

    it('파일이 없으면 에러를 던져야 합니다', async () => {
      // When & Then
      await expect(
        uploadService.uploadImage(null as unknown as Express.Multer.File, mockUserId, mockCompanyId)
      ).rejects.toThrow(CustomError);
    });

    it('S3 업로드 실패 시 에러를 던져야 합니다', async () => {
      // Given
      (s3Client.send as jest.Mock).mockRejectedValueOnce(new Error('S3 upload failed'));

      // When & Then
      await expect(uploadService.uploadImage(mockFile, mockUserId, mockCompanyId)).rejects.toThrow(
        CustomError
      );
    });

    it('DB 저장 실패 시 S3 파일을 정리하고 에러를 던져야 합니다', async () => {
      // Given
      (s3Client.send as jest.Mock)
        .mockResolvedValueOnce({}) // PutObjectCommand 성공
        .mockResolvedValueOnce({}); // DeleteObjectCommand (cleanup)
      (prisma.uploads.create as jest.Mock).mockRejectedValueOnce(new Error('DB insert failed'));

      // When & Then
      await expect(uploadService.uploadImage(mockFile, mockUserId, mockCompanyId)).rejects.toThrow(
        CustomError
      );
      expect(s3Client.send).toHaveBeenCalledTimes(2); // PutObject + DeleteObject
    });
  });

  describe('getImageUrl', () => {
    const mockKey = 'misc/test.jpg';
    const mockUpload: Uploads = {
      id: 1,
      userId: mockUserId,
      companyId: mockCompanyId,
      productId: null,
      key: mockKey,
      folder: 'misc',
      originalName: 'test.jpg',
      size: 1024,
      mimeType: 'image/jpeg',
      createdAt: new Date(),
    };

    it('파일 소유자는 Signed URL을 받을 수 있어야 합니다', async () => {
      // Given
      const mockSignedUrl = 'https://signed-url.example.com/test.jpg';
      (prisma.uploads.findUnique as jest.Mock).mockResolvedValueOnce(mockUpload);
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockSignedUrl);

      // When
      const result = await uploadService.getImageUrl(mockKey, mockUserId, 'USER', mockCompanyId);

      // Then
      expect(prisma.uploads.findUnique).toHaveBeenCalledWith({ where: { key: mockKey } });
      expect(result.success).toBe(true);
      expect(result.data.url).toBe(mockSignedUrl);
    });

    it('같은 회사의 MANAGER는 파일에 접근할 수 있어야 합니다', async () => {
      // Given
      const managerUserId = 'manager-123';
      const mockSignedUrl = 'https://signed-url.example.com/test.jpg';
      (prisma.uploads.findUnique as jest.Mock).mockResolvedValueOnce(mockUpload);
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockSignedUrl);

      // When
      const result = await uploadService.getImageUrl(
        mockKey,
        managerUserId,
        'MANAGER',
        mockCompanyId
      );

      // Then
      expect(result.success).toBe(true);
    });

    it('같은 회사의 ADMIN은 파일에 접근할 수 있어야 합니다', async () => {
      // Given
      const adminUserId = 'admin-123';
      const mockSignedUrl = 'https://signed-url.example.com/test.jpg';
      (prisma.uploads.findUnique as jest.Mock).mockResolvedValueOnce(mockUpload);
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockSignedUrl);

      // When
      const result = await uploadService.getImageUrl(mockKey, adminUserId, 'ADMIN', mockCompanyId);

      // Then
      expect(result.success).toBe(true);
    });

    it('다른 회사의 USER는 파일에 접근할 수 없어야 합니다', async () => {
      // Given
      const otherUserId = 'other-user-123';
      const otherCompanyId = 'other-company-123';
      (prisma.uploads.findUnique as jest.Mock).mockResolvedValueOnce(mockUpload);

      // When & Then
      await expect(
        uploadService.getImageUrl(mockKey, otherUserId, 'USER', otherCompanyId)
      ).rejects.toThrow(CustomError);
    });

    it('같은 회사의 USER가 소유자가 아니면 접근할 수 없어야 합니다', async () => {
      // Given
      const otherUserId = 'other-user-123';
      (prisma.uploads.findUnique as jest.Mock).mockResolvedValueOnce(mockUpload);

      // When & Then
      await expect(
        uploadService.getImageUrl(mockKey, otherUserId, 'USER', mockCompanyId)
      ).rejects.toThrow(CustomError);
    });

    it('존재하지 않는 파일에 대해 에러를 던져야 합니다', async () => {
      // Given
      (prisma.uploads.findUnique as jest.Mock).mockResolvedValueOnce(null);

      // When & Then
      await expect(
        uploadService.getImageUrl(mockKey, mockUserId, 'USER', mockCompanyId)
      ).rejects.toThrow(CustomError);
    });

    it('다운로드 모드일 때 Content-Disposition 헤더를 설정해야 합니다', async () => {
      // Given
      const mockSignedUrl = 'https://signed-url.example.com/test.jpg';
      (prisma.uploads.findUnique as jest.Mock).mockResolvedValueOnce(mockUpload);
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockSignedUrl);

      // When
      await uploadService.getImageUrl(mockKey, mockUserId, 'USER', mockCompanyId, true);

      // Then
      expect(getSignedUrl).toHaveBeenCalledWith(
        s3Client,
        expect.objectContaining({
          input: expect.objectContaining({
            ResponseContentDisposition: expect.stringContaining('attachment'),
          }),
        }),
        { expiresIn: PRESIGNED_URL_EXPIRES_IN }
      );
    });
  });

  describe('deleteImage', () => {
    const mockKey = 'misc/test.jpg';
    const mockUpload: Uploads = {
      id: 1,
      userId: mockUserId,
      companyId: mockCompanyId,
      productId: null,
      key: mockKey,
      folder: 'misc',
      originalName: 'test.jpg',
      size: 1024,
      mimeType: 'image/jpeg',
      createdAt: new Date(),
    };

    it('파일 소유자는 파일을 삭제할 수 있어야 합니다', async () => {
      // Given
      (prisma.uploads.findUnique as jest.Mock).mockResolvedValueOnce(mockUpload);
      (s3Client.send as jest.Mock).mockResolvedValueOnce({});
      (prisma.uploads.delete as jest.Mock).mockResolvedValueOnce(mockUpload);

      // When
      const result = await uploadService.deleteImage(mockKey, mockUserId, 'USER', mockCompanyId);

      // Then
      expect(s3Client.send).toHaveBeenCalled();
      expect(prisma.uploads.delete).toHaveBeenCalledWith({ where: { key: mockKey } });
      expect(result.success).toBe(true);
    });

    it('같은 회사의 MANAGER는 파일을 삭제할 수 있어야 합니다', async () => {
      // Given
      const managerUserId = 'manager-123';
      (prisma.uploads.findUnique as jest.Mock).mockResolvedValueOnce(mockUpload);
      (s3Client.send as jest.Mock).mockResolvedValueOnce({});
      (prisma.uploads.delete as jest.Mock).mockResolvedValueOnce(mockUpload);

      // When
      const result = await uploadService.deleteImage(
        mockKey,
        managerUserId,
        'MANAGER',
        mockCompanyId
      );

      // Then
      expect(result.success).toBe(true);
    });

    it('같은 회사의 ADMIN은 파일을 삭제할 수 있어야 합니다', async () => {
      // Given
      const adminUserId = 'admin-123';
      (prisma.uploads.findUnique as jest.Mock).mockResolvedValueOnce(mockUpload);
      (s3Client.send as jest.Mock).mockResolvedValueOnce({});
      (prisma.uploads.delete as jest.Mock).mockResolvedValueOnce(mockUpload);

      // When
      const result = await uploadService.deleteImage(mockKey, adminUserId, 'ADMIN', mockCompanyId);

      // Then
      expect(result.success).toBe(true);
    });

    it('다른 회사의 USER는 파일을 삭제할 수 없어야 합니다', async () => {
      // Given
      const otherUserId = 'other-user-123';
      const otherCompanyId = 'other-company-123';
      (prisma.uploads.findUnique as jest.Mock).mockResolvedValueOnce(mockUpload);

      // When & Then
      await expect(
        uploadService.deleteImage(mockKey, otherUserId, 'USER', otherCompanyId)
      ).rejects.toThrow(CustomError);
    });

    it('같은 회사의 USER가 소유자가 아니면 삭제할 수 없어야 합니다', async () => {
      // Given
      const otherUserId = 'other-user-123';
      (prisma.uploads.findUnique as jest.Mock).mockResolvedValueOnce(mockUpload);

      // When & Then
      await expect(
        uploadService.deleteImage(mockKey, otherUserId, 'USER', mockCompanyId)
      ).rejects.toThrow(CustomError);
    });

    it('존재하지 않는 파일에 대해 에러를 던져야 합니다', async () => {
      // Given
      (prisma.uploads.findUnique as jest.Mock).mockResolvedValueOnce(null);

      // When & Then
      await expect(
        uploadService.deleteImage(mockKey, mockUserId, 'USER', mockCompanyId)
      ).rejects.toThrow(CustomError);
    });

    it('S3 삭제 실패 시 에러를 던져야 합니다', async () => {
      // Given
      (prisma.uploads.findUnique as jest.Mock).mockResolvedValueOnce(mockUpload);
      (s3Client.send as jest.Mock).mockRejectedValueOnce(new Error('S3 delete failed'));

      // When & Then
      await expect(
        uploadService.deleteImage(mockKey, mockUserId, 'USER', mockCompanyId)
      ).rejects.toThrow(CustomError);
    });

    it('DB 삭제 실패 시 에러를 던져야 합니다', async () => {
      // Given
      (prisma.uploads.findUnique as jest.Mock).mockResolvedValueOnce(mockUpload);
      (s3Client.send as jest.Mock).mockResolvedValueOnce({});
      (prisma.uploads.delete as jest.Mock).mockRejectedValueOnce(new Error('DB delete failed'));

      // When & Then
      await expect(
        uploadService.deleteImage(mockKey, mockUserId, 'USER', mockCompanyId)
      ).rejects.toThrow(CustomError);
    });
  });
});
