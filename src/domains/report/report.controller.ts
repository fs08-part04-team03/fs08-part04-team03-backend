import { Response } from 'express';
import ExcelJS from 'exceljs';
import { CustomError } from '../../common/utils/error.util';
import { HttpStatus } from '../../common/constants/httpStatus.constants';
import { ErrorCodes } from '../../common/constants/errorCodes.constants';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import { reportService, REPORT_EXPORT_MAX_ROWS } from './report.service';
import type {
  ExportPurchaseRequestsCursor,
  ExportPurchaseRequestsFilters,
  ExportPurchaseRequestsQuery,
} from './report.types';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const getQueryString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const parseDateInput = (value: string, endOfDay: boolean): Date => {
  if (DATE_ONLY_REGEX.test(value)) {
    const parts = value.split('-');
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      return new Date(value);
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if ([year, month, day].some((part) => Number.isNaN(part))) {
      return new Date(value);
    }

    if (endOfDay) {
      return new Date(year, month - 1, day, 23, 59, 59, 999);
    }
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  return new Date(value);
};

const resolveDecisionDateRange = (fromRaw: string, toRaw: string): { from: Date; to: Date } => {
  const from = parseDateInput(fromRaw, false);
  const to = parseDateInput(toRaw, true);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    throw new CustomError(
      HttpStatus.BAD_REQUEST,
      ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
      '유효하지 않은 날짜 범위입니다.'
    );
  }

  return { from, to };
};

const formatDateForFilename = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

export const reportController = {
  // 구매 내역을 정리해서 excel로 출력 (ADMIN 전용)
  exportPurchaseRequests: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '유저 정보가 없습니다.'
      );
    }

    const fromRaw = getQueryString(req.query.from);
    const toRaw = getQueryString(req.query.to);
    const status = getQueryString(req.query.status) as ExportPurchaseRequestsQuery['status'];
    const role = getQueryString(req.query.role) as ExportPurchaseRequestsQuery['role'];

    if (!fromRaw || !toRaw) {
      throw new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.GENERAL_INVALID_REQUEST_BODY,
        '시작일과 종료일은 필수입니다.'
      );
    }

    const { from, to } = resolveDecisionDateRange(fromRaw, toRaw);

    const filters: ExportPurchaseRequestsFilters = {
      companyId: req.user.companyId,
      from,
      to,
      status,
      requesterRole: role,
    };

    const totalCount = await reportService.countExportPurchaseRequests(filters);
    // 너무 많은 양의 데이터를 한 번에 내보내지 못하도록 제한
    if (totalCount > REPORT_EXPORT_MAX_ROWS) {
      throw new CustomError(
        HttpStatus.UNPROCESSABLE_CONTENT,
        ErrorCodes.GENERAL_BAD_REQUEST,
        `내보내기 제한을 초과했습니다 (${totalCount} 행). 날짜 범위를 ${REPORT_EXPORT_MAX_ROWS} 행 이하로 좁히세요.`
      );
    }

    const fromLabel = formatDateForFilename(from);
    const toLabel = formatDateForFilename(to);
    const filename = `purchase_requests_${fromLabel}-${toLabel}.xlsx`;
    const asciiFilename = filename.replace(/[^\x20-\x7E]/g, '_');

    res.status(HttpStatus.OK);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
      useStyles: true,
      useSharedStrings: true,
    });
    const worksheet = workbook.addWorksheet('Purchase Requests');
    worksheet.columns = [
      { header: '요청 ID', key: 'requestId', width: 36 },
      {
        header: '요청 날짜',
        key: 'requestDate',
        width: 20,
        style: { numFmt: 'yyyy-mm-dd hh:mm:ss' },
      },
      {
        header: '승인/거절 날짜',
        key: 'decisionDate',
        width: 20,
        style: { numFmt: 'yyyy-mm-dd hh:mm:ss' },
      },
      { header: '상태', key: 'status', width: 12 },
      { header: '요청자 이름', key: 'requesterName', width: 20 },
      { header: '요청자 이메일', key: 'requesterEmail', width: 28 },
      { header: '요청자 역할', key: 'requesterRole', width: 14 },
      { header: '승인자 이름', key: 'approverName', width: 20 },
      { header: '승인자 이메일', key: 'approverEmail', width: 28 },
      { header: '전체 가격', key: 'totalPrice', width: 14, style: { numFmt: '#,##0' } },
      { header: '배송비', key: 'shippingFee', width: 14, style: { numFmt: '#,##0' } },
      { header: '요청 메시지', key: 'requestMessage', width: 40 },
      { header: '승인 사유', key: 'approvalReason', width: 30 },
      { header: '거절 사유', key: 'rejectionReason', width: 30 },
      { header: '상품 요약', key: 'itemsSummary', width: 60 },
      { header: '상품 개수', key: 'itemCount', width: 12 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.commit();

    const writeBatch = async (cursor?: ExportPurchaseRequestsCursor): Promise<void> => {
      const batch = await reportService.fetchExportPurchaseRequestsBatch(filters, cursor);
      if (batch.length === 0) return;

      batch.forEach((purchaseRequest) => {
        const itemsSummary = purchaseRequest.purchaseItems
          .map((item) => `${item.products.name} x${item.quantity}`)
          .join(', ');

        worksheet
          .addRow({
            requestId: purchaseRequest.id,
            requestDate: purchaseRequest.createdAt,
            decisionDate: purchaseRequest.updatedAt,
            status: purchaseRequest.status,
            requesterName: purchaseRequest.requester.name,
            requesterEmail: purchaseRequest.requester.email,
            requesterRole: purchaseRequest.requester.role,
            approverName: purchaseRequest.approver?.name ?? '',
            approverEmail: purchaseRequest.approver?.email ?? '',
            totalPrice: purchaseRequest.totalPrice,
            shippingFee: purchaseRequest.shippingFee,
            requestMessage: purchaseRequest.requestMessage ?? '',
            approvalReason: purchaseRequest.reason ?? '',
            rejectionReason: purchaseRequest.rejectReason ?? '',
            itemsSummary,
            itemCount: purchaseRequest.purchaseItems.length,
          })
          .commit();
      });

      const lastRow = batch[batch.length - 1];
      if (!lastRow) return;
      await writeBatch({ id: lastRow.id, updatedAt: lastRow.updatedAt });
    };

    await writeBatch();

    worksheet.commit();
    await workbook.commit();
  },
};
