// budget에서 사용되는 타입 정의
export type CreateBudgetBody = {
  year: number;
  month: number;
  amount: number;
};

export type UpdateBudgetBody = {
  amount: number;
};

export type BudgetQuery = {
  year?: number;
  month?: number;
};

export type UpsertCriteriaBody = {
  amount: number;
};
