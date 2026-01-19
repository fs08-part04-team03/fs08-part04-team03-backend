import type { purchaseStatus, role as RoleEnum } from '@prisma/client';

export type ReportRequesterRole = RoleEnum | 'ALL';

// 구매 요청 엑셀 내보내기 파라미터
export interface ExportPurchaseRequestsQuery {
  from: string;
  to: string;
  status?: purchaseStatus;
  role?: ReportRequesterRole;
}

// 구매 요청 엑셀 내보내기 필터
export interface ExportPurchaseRequestsFilters {
  companyId: string;
  from: Date;
  to: Date;
  status?: purchaseStatus;
  requesterRole?: ReportRequesterRole;
}

// 커서 기반 페이지네이션을 위한 커서 정보
export interface ExportPurchaseRequestsCursor {
  id: string;
  updatedAt: Date;
}

// 구매 요청 엑셀 내보내기 항목
export interface PurchaseRequestExportItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: purchaseStatus;
  totalPrice: number;
  shippingFee: number;
  requestMessage: string | null;
  reason: string | null;
  rejectReason: string | null;
  requester: {
    name: string;
    email: string;
    role: RoleEnum;
  };
  approver: {
    name: string;
    email: string;
  } | null;
  purchaseItems: Array<{
    quantity: number;
    products: {
      name: string;
    };
  }>;
}
