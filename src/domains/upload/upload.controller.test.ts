import { Response } from 'express';
import { Readable } from 'stream';
import { CustomError } from '@/common/utils/error.util';
import { HttpStatus } from '@/common/constants/httpStatus.constants';
import type { AuthenticatedRequest } from '@/common/types/common.types';
import { uploadController } from './upload.controller';
import { uploadService } from './upload.service';

// uploadService 모킹
jest.mock('./upload.service');

describe('UploadController', () => {
  const mockUserId = 'user-id';
  const mockCompanyId = 'company-id';
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      user: {
        id: mockUserId,
        companyId: mockCompanyId,
        role: 'USER',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('uploadImage', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test'),
      stream: null as unknown as Readable,
      destination: '',
      filename: '',
      path: '',
    };

    const mockUploadResult = {
      success: true,
      data: {
        key: 'misc/test.jpg',
        url: 'https://example.com/misc/test.jpg',
        signedUrl: 'https://signed-url.com',
        expiresIn: 3600,
        originalName: 'test.jpg',
        size: 1024,
        mimeType: 'image/jpeg',
      },
      message: '이미지 업로드가 완료되었습니다.',
    };

    it('정상적으로 이미지를 업로드해야 합니다', async () => {
      // Given
      mockRequest.file = mockFile;
      mockRequest.query = { folder: 'misc' };
      (uploadService.uploadImage as jest.Mock).mockResolvedValue(mockUploadResult);

      // When
      await uploadController.uploadImage(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Then
      expect(uploadService.uploadImage).toHaveBeenCalledWith(
        mockFile,
        mockUserId,
        mockCompanyId,
        undefined,
        'misc'
      );
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(jsonMock).toHaveBeenCalledWith(mockUploadResult);
    });

    it('productId가 쿼리에 포함되면 서비스에 전달해야 합니다', async () => {
      // Given
      mockRequest.file = mockFile;
      mockRequest.query = { folder: 'products', productId: '123' };
      (uploadService.uploadImage as jest.Mock).mockResolvedValue(mockUploadResult);

      // When
      await uploadController.uploadImage(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Then
      expect(uploadService.uploadImage).toHaveBeenCalledWith(
        mockFile,
        mockUserId,
        mockCompanyId,
        123,
        'products'
      );
    });

    it('파일이 없으면 에러를 던져야 합니다', async () => {
      // Given
      mockRequest.file = undefined;
      mockRequest.query = { folder: 'misc' };

      // When & Then
      await expect(
        uploadController.uploadImage(mockRequest as AuthenticatedRequest, mockResponse as Response)
      ).rejects.toThrow(CustomError);
    });

    it('인증 정보가 없으면 에러를 던져야 합니다', async () => {
      // Given
      mockRequest.user = undefined;
      mockRequest.file = mockFile;
      mockRequest.query = { folder: 'misc' };

      // When & Then
      await expect(
        uploadController.uploadImage(mockRequest as AuthenticatedRequest, mockResponse as Response)
      ).rejects.toThrow(CustomError);
    });

    it('유효하지 않은 productId가 제공되면 에러를 던져야 합니다', async () => {
      // Given
      mockRequest.file = mockFile;
      mockRequest.query = { folder: 'products', productId: 'invalid' };

      // When & Then
      await expect(
        uploadController.uploadImage(mockRequest as AuthenticatedRequest, mockResponse as Response)
      ).rejects.toThrow(CustomError);
    });
  });

  describe('uploadMultipleImages', () => {
    const mockFiles: Express.Multer.File[] = [
      {
        fieldname: 'images',
        originalname: 'test1.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test1'),
        stream: null as unknown as Readable,
        destination: '',
        filename: '',
        path: '',
      },
      {
        fieldname: 'images',
        originalname: 'test2.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 2048,
        buffer: Buffer.from('test2'),
        stream: null as unknown as Readable,
        destination: '',
        filename: '',
        path: '',
      },
    ];

    const mockUploadResult = {
      success: true,
      data: {
        key: 'misc/test1.jpg',
        url: 'https://example.com/misc/test1.jpg',
        signedUrl: 'https://signed-url.com',
        expiresIn: 3600,
        originalName: 'test1.jpg',
        size: 1024,
        mimeType: 'image/jpeg',
      },
      message: '이미지 업로드가 완료되었습니다.',
    };

    it('여러 이미지를 정상적으로 업로드해야 합니다', async () => {
      // Given
      mockRequest.files = mockFiles;
      mockRequest.query = { folder: 'misc' };
      (uploadService.uploadImage as jest.Mock).mockResolvedValue(mockUploadResult);

      // When
      await uploadController.uploadMultipleImages(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Then
      expect(uploadService.uploadImage).toHaveBeenCalledTimes(2);
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('2개의 이미지 업로드가 완료되었습니다'),
        })
      );
    });

    it('일부 업로드가 실패해도 성공한 것만 반환해야 합니다', async () => {
      // Given
      mockRequest.files = mockFiles;
      mockRequest.query = { folder: 'misc' };
      (uploadService.uploadImage as jest.Mock)
        .mockResolvedValueOnce(mockUploadResult)
        .mockRejectedValueOnce(new Error('Upload failed'));

      // When
      await uploadController.uploadMultipleImages(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Then
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('1개의 이미지 업로드가 완료되었습니다'),
          warnings: expect.any(Array),
        })
      );
    });

    it('모든 업로드가 실패하면 에러를 던져야 합니다', async () => {
      // Given
      mockRequest.files = mockFiles;
      mockRequest.query = { folder: 'misc' };
      (uploadService.uploadImage as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      // When & Then
      await expect(
        uploadController.uploadMultipleImages(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response
        )
      ).rejects.toThrow(CustomError);
    });

    it('파일이 없으면 에러를 던져야 합니다', async () => {
      // Given
      mockRequest.files = [];
      mockRequest.query = { folder: 'misc' };

      // When & Then
      await expect(
        uploadController.uploadMultipleImages(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response
        )
      ).rejects.toThrow(CustomError);
    });

    it('인증 정보가 없으면 에러를 던져야 합니다', async () => {
      // Given
      mockRequest.user = undefined;
      mockRequest.files = mockFiles;
      mockRequest.query = { folder: 'misc' };

      // When & Then
      await expect(
        uploadController.uploadMultipleImages(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response
        )
      ).rejects.toThrow(CustomError);
    });
  });

  describe('getImageUrl', () => {
    const mockKey = 'misc/test.jpg';
    const mockResult = {
      success: true,
      data: {
        key: mockKey,
        url: 'https://signed-url.com',
        expiresIn: 3600,
      },
      message: '이미지 URL을 조회했습니다.',
    };

    it('정상적으로 이미지 URL을 조회해야 합니다', async () => {
      // Given
      mockRequest.params = { key: mockKey };
      mockRequest.query = {};
      (uploadService.getImageUrl as jest.Mock).mockResolvedValue(mockResult);

      // When
      await uploadController.getImageUrl(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Then
      expect(uploadService.getImageUrl).toHaveBeenCalledWith(
        mockKey,
        mockUserId,
        'USER',
        mockCompanyId,
        false
      );
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonMock).toHaveBeenCalledWith(mockResult);
    });

    it('다운로드 모드로 이미지 URL을 조회할 수 있어야 합니다', async () => {
      // Given
      mockRequest.params = { key: mockKey };
      mockRequest.query = { download: 'true' };
      (uploadService.getImageUrl as jest.Mock).mockResolvedValue(mockResult);

      // When
      await uploadController.getImageUrl(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Then
      expect(uploadService.getImageUrl).toHaveBeenCalledWith(
        mockKey,
        mockUserId,
        'USER',
        mockCompanyId,
        true
      );
    });

    it('키가 없으면 에러를 던져야 합니다', async () => {
      // Given
      mockRequest.params = {};
      mockRequest.query = {};

      // When & Then
      await expect(
        uploadController.getImageUrl(mockRequest as AuthenticatedRequest, mockResponse as Response)
      ).rejects.toThrow(CustomError);
    });

    it('인증 정보가 없으면 에러를 던져야 합니다', async () => {
      // Given
      mockRequest.user = undefined;
      mockRequest.params = { key: mockKey };
      mockRequest.query = {};

      // When & Then
      await expect(
        uploadController.getImageUrl(mockRequest as AuthenticatedRequest, mockResponse as Response)
      ).rejects.toThrow(CustomError);
    });
  });

  describe('deleteImage', () => {
    const mockKey = 'misc/test.jpg';
    const mockResult = {
      success: true,
      data: null,
      message: '이미지가 삭제되었습니다.',
    };

    it('정상적으로 이미지를 삭제해야 합니다', async () => {
      // Given
      mockRequest.params = { key: mockKey };
      (uploadService.deleteImage as jest.Mock).mockResolvedValue(mockResult);

      // When
      await uploadController.deleteImage(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Then
      expect(uploadService.deleteImage).toHaveBeenCalledWith(
        mockKey,
        mockUserId,
        'USER',
        mockCompanyId
      );
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonMock).toHaveBeenCalledWith(mockResult);
    });

    it('키가 없으면 에러를 던져야 합니다', async () => {
      // Given
      mockRequest.params = {};

      // When & Then
      await expect(
        uploadController.deleteImage(mockRequest as AuthenticatedRequest, mockResponse as Response)
      ).rejects.toThrow(CustomError);
    });

    it('인증 정보가 없으면 에러를 던져야 합니다', async () => {
      // Given
      mockRequest.user = undefined;
      mockRequest.params = { key: mockKey };

      // When & Then
      await expect(
        uploadController.deleteImage(mockRequest as AuthenticatedRequest, mockResponse as Response)
      ).rejects.toThrow(CustomError);
    });
  });
});
