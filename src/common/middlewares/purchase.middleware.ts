import type { NextFunction, Response } from 'express';
import { CustomError } from '../utils/error.util';
import { HttpStatus } from '../constants/httpStatus.constants';
import { ErrorCodes } from '../constants/errorCodes.constants';
import { prisma } from '../database/prisma.client';
import type { BudgetCheckRequest } from '../types/common.types';

/**
 * 예산 검증 미들웨어
 *
 * 구매 요청 전에 회사의 예산이 충분한지 검증합니다.
 * - 사용자 인증 확인
 * - 회사의 총 예산 조회
 * - 구매할 상품들의 총 가격 계산
 * - 예산 초과 여부 확인
 *
 * @param req - BudgetCheckRequest (user, body.items, body.shippingFee 포함)
 * @param _res - Express Response 객체
 * @param next - Express NextFunction
 */
export async function checkBudget(req: BudgetCheckRequest, _res: Response, next: NextFunction) {
  // item 배열 유효성 검사
  if (!req.body.items || req.body.items.length === 0) {
    return next(
      new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.PURCHASE_NOT_FOUND,
        '구매할 상품이 없습니다.'
      )
    );
  }

  // 1. 유저 인증 확인
  // 요청자가 로그인되어 있고 회사에 소속되어 있는지 확인
  if (!req.user?.companyId) {
    return next(
      new CustomError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_UNAUTHORIZED,
        '유저 인증에 실패했습니다.'
      )
    );
  }

  // 2. 회사 예산 합계 계산
  // budgets 테이블에서 해당 회사의 모든 예산을 합산
  const userBudget = await prisma.budgets.aggregate({
    where: { companyId: req.user.companyId },
    _sum: { amount: true },
  });

  // Prisma aggregate 결과에서 합계 금액 추출 (null일 경우 0으로 처리)
  // eslint-disable-next-line no-underscore-dangle
  const totalBudget = userBudget._sum.amount ?? 0;

  // 3. 예산이 0인 경우 처리
  // 회사에 등록된 예산이 없으면 구매 불가
  if (totalBudget === 0) {
    // TODO: 이메일을 보내는 함수 만들기 (메시지: 예산이 없습니다)

    return next(
      new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.PURCHASE_INSUFFICIENT_BUDGET,
        '이 회사의 예산이 없습니다.'
      )
    );
  }

  // 4. 구매 금액 계산
  // 요청된 모든 상품의 가격을 병렬로 조회하여 계산
  const productPromises = req.body.items.map(async (item) => {
    // 4-1. 각 상품의 현재 가격 조회
    const product = await prisma.products.findUnique({
      where: { id: item.productId },
      select: { price: true },
    });

    // 4-2. 상품이 존재하지 않으면 에러 발생
    if (!product) {
      throw new CustomError(
        HttpStatus.NOT_FOUND,
        ErrorCodes.GENERAL_NOT_FOUND,
        `Product with id ${item.productId} not found`
      );
    }

    // 4-3. (상품 가격 × 수량) 반환
    return product.price * item.quantity;
  });

  // 5. 모든 상품의 가격을 병렬로 조회하고 합산
  let totalPrice = 0;
  try {
    // Promise.all로 모든 상품 가격 조회를 병렬 처리 (성능 최적화)
    const prices = await Promise.all(productPromises);
    // reduce로 모든 가격을 합산
    totalPrice = prices.reduce((sum, price) => sum + price, 0);
  } catch (error) {
    // 상품 조회 중 에러 발생 시 (예: 존재하지 않는 상품)
    return next(error);
  }

  // 6. 최종 구매 금액 계산 (상품 총액 + 배송비)
  const purchasePrice: number = req.body.shippingFee + totalPrice;

  // 7. 사용 가능한 예산 계산 (총 예산 - 구매 금액)
  const availableBudget = totalBudget - purchasePrice;

  // 8. 예산 부족 시 처리
  // 구매 후 예산이 음수가 되면 구매 불가
  if (availableBudget < 0) {
    // TODO: 이메일을 보내는 함수 만들기 (메시지: 예산이 부족합니다)

    return next(
      new CustomError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.PURCHASE_INSUFFICIENT_BUDGET,
        '물품을 구매하기에 예산이 부족합니다.'
      )
    );
  }

  // 9. 예산 검증 통과 - 다음 미들웨어로 진행
  return next();
}
