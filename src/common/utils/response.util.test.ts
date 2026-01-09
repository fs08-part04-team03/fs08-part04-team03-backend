import { ResponseUtil } from './response.util';

describe('Response Util', () => {
  describe('success', () => {
    it('성공 응답을 생성해야 합니다', () => {
      // Given
      const data = { id: 1, name: '테스트' };

      // When
      const result = ResponseUtil.success(data);

      // Then
      expect(result).toEqual({
        success: true,
        data,
        message: '성공',
      });
    });

    it('커스텀 메시지를 포함한 성공 응답을 생성해야 합니다', () => {
      // Given
      const data = { id: 1, name: '테스트' };
      const message = '데이터 조회에 성공했습니다.';

      // When
      const result = ResponseUtil.success(data, message);

      // Then
      expect(result).toEqual({
        success: true,
        data,
        message,
      });
    });

    it('빈 객체를 데이터로 사용할 수 있어야 합니다', () => {
      // Given
      const data = {};

      // When
      const result = ResponseUtil.success(data);

      // Then
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('배열 데이터를 포함한 성공 응답을 생성해야 합니다', () => {
      // Given
      const data = [
        { id: 1, name: '항목1' },
        { id: 2, name: '항목2' },
      ];

      // When
      const result = ResponseUtil.success(data);

      // Then
      expect(result.data).toEqual(data);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('null 데이터를 포함한 성공 응답을 생성해야 합니다', () => {
      // Given
      const data = null;

      // When
      const result = ResponseUtil.success(data);

      // Then
      expect(result.data).toBeNull();
    });

    it('문자열 데이터를 포함한 성공 응답을 생성해야 합니다', () => {
      // Given
      const data = '성공적으로 처리되었습니다.';

      // When
      const result = ResponseUtil.success(data);

      // Then
      expect(result.data).toBe(data);
    });

    it('숫자 데이터를 포함한 성공 응답을 생성해야 합니다', () => {
      // Given
      const data = 42;

      // When
      const result = ResponseUtil.success(data);

      // Then
      expect(result.data).toBe(42);
    });

    it('불린 데이터를 포함한 성공 응답을 생성해야 합니다', () => {
      // Given
      const data = true;

      // When
      const result = ResponseUtil.success(data);

      // Then
      expect(result.data).toBe(true);
    });
  });

  describe('successWithPagination', () => {
    it('페이지네이션을 포함한 성공 응답을 생성해야 합니다', () => {
      // Given
      const data = [
        { id: 1, name: '항목1' },
        { id: 2, name: '항목2' },
      ];
      const pagination = { page: 1, limit: 10, total: 2 };

      // When
      const result = ResponseUtil.successWithPagination(data, pagination);

      // Then
      expect(result).toEqual({
        success: true,
        data,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
        message: '조회 성공',
      });
    });

    it('커스텀 메시지를 포함한 페이지네이션 응답을 생성해야 합니다', () => {
      // Given
      const data = [{ id: 1 }];
      const pagination = { page: 1, limit: 10, total: 1 };
      const message = '사용자 목록 조회 성공';

      // When
      const result = ResponseUtil.successWithPagination(data, pagination, message);

      // Then
      expect(result.message).toBe(message);
    });

    it('totalPages를 올바르게 계산해야 합니다', () => {
      // Given
      const data = Array(25)
        .fill(null)
        .map((_, i) => ({ id: i + 1 }));
      const pagination = { page: 1, limit: 10, total: 25 };

      // When
      const result = ResponseUtil.successWithPagination(data, pagination);

      // Then
      expect(result.pagination.totalPages).toBe(3); // Math.ceil(25 / 10) = 3
    });

    it('빈 배열과 페이지네이션 응답을 생성해야 합니다', () => {
      // Given
      const data: any[] = [];
      const pagination = { page: 1, limit: 10, total: 0 };

      // When
      const result = ResponseUtil.successWithPagination(data, pagination);

      // Then
      expect(result.data).toEqual([]);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('마지막 페이지의 totalPages를 올바르게 계산해야 합니다', () => {
      // Given
      const data = [{ id: 1 }];
      const pagination = { page: 3, limit: 10, total: 25 };

      // When
      const result = ResponseUtil.successWithPagination(data, pagination);

      // Then
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.page).toBe(3);
    });

    it('limit이 0일 때 totalPages가 0이어야 합니다', () => {
      // Given
      const data: any[] = [];
      const pagination = { page: 1, limit: 0, total: 10 };

      // When
      const result = ResponseUtil.successWithPagination(data, pagination);

      // Then
      expect(result.pagination.totalPages).toBe(0);
    });

    it('다양한 페이지 크기로 totalPages를 계산해야 합니다', () => {
      // Given & When & Then
      // 100개의 항목, 10개씩 페이징
      const result1 = ResponseUtil.successWithPagination([], { page: 1, limit: 10, total: 100 });
      expect(result1.pagination.totalPages).toBe(10);

      // 100개의 항목, 25개씩 페이징
      const result2 = ResponseUtil.successWithPagination([], { page: 1, limit: 25, total: 100 });
      expect(result2.pagination.totalPages).toBe(4);

      // 99개의 항목, 10개씩 페이징
      const result3 = ResponseUtil.successWithPagination([], { page: 1, limit: 10, total: 99 });
      expect(result3.pagination.totalPages).toBe(10);

      // 101개의 항목, 10개씩 페이징
      const result4 = ResponseUtil.successWithPagination([], { page: 1, limit: 10, total: 101 });
      expect(result4.pagination.totalPages).toBe(11);
    });

    it('페이지네이션 정보를 모두 포함해야 합니다', () => {
      // Given
      const data = [{ id: 1 }];
      const pagination = { page: 2, limit: 5, total: 20 };

      // When
      const result = ResponseUtil.successWithPagination(data, pagination);

      // Then
      expect(result.pagination).toHaveProperty('page', 2);
      expect(result.pagination).toHaveProperty('limit', 5);
      expect(result.pagination).toHaveProperty('total', 20);
      expect(result.pagination).toHaveProperty('totalPages', 4);
    });
  });
});
