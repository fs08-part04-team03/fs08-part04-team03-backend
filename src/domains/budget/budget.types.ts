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
