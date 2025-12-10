export class ResponseUtil {
  // 일반 성공 응답
  static success<T>(data: T, message = '성공') {
    return { success: true, data, message };
  }

  // 페이징이 포함된 성공 응답
  static successWithPagination<T>(
    data: T[],
    pagination: { page: number; limit: number; total: number },
    message = '조회 성공'
  ) {
    const { page, limit, total } = pagination;
    return {
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message,
    };
  }
}
