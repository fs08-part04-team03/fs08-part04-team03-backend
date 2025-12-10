// 설명: Cron 작업 스케줄 설정
// node-cron을 사용하여 매 월 UTC 기준  1일 00:00에 예산을 criteria에 따라 생성하는 스케줄려 설정
import cron from 'node-cron';
import { budgetService } from '../domains/budget/budget.service';

/**
 * 매월 1일 00:00 UTC에 예산을 자동 생성하도록 예약된 작업을 등록한다.
 *
 * 예약된 실행 시 현재 UTC 기준 연도와 월을 계산하여 `budgetService.seedMonthlyBudgetsFromCriteria`를 호출해 해당 월의 예산을 생성하며, 성공 또는 실패 결과를 콘솔에 기록한다.
 */
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
