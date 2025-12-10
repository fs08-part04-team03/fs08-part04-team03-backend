// 설명: Cron 작업 스케줄 설정
// node-cron을 사용하여 매 월 UTC 기준  1일 00:00에 예산을 criteria에 따라 생성하는 스케줄려 설정
import cron from 'node-cron';
import { budgetService } from '../domains/budget/budget.service';

export function startBudgetScheduler() {
  cron.schedule(
    // 매달 1일 00:00 UTC
    '0 0 1 * *',
    async () => {
      try {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = now.getUTCMonth() + 1; // 1~12
        await budgetService.seedMonthlyBudgetsFromCriteria(year, month);
        console.log(`[budget] seeded for ${year}-${month}`);
      } catch (err) {
        console.error('[budget] monthly seed failed', err);
      }
    },
    { timezone: 'UTC' }
  );
}
