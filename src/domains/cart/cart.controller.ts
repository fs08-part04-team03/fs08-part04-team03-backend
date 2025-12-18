import { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import { cartService } from './cart.service';

export const cartController = {
  // 🛒 [Cart] 장바구니에 상품 추가 API
  addToCart: async (req: AuthenticatedRequest, res: Response) => {
    const { productId, quantity } = req.body as { productId: number; quantity: number };

    const result = await cartService.addToCart(req.user!.id, productId, quantity);

    res.status(201).json({
      message: result.isNew
        ? '장바구니에 상품이 추가되었습니다.'
        : '장바구니 상품의 수량이 증가했습니다.',
      result,
    });
  },

  // 🛒 [Cart] 내 장바구니 조회 API
  getMyCart: async (req: AuthenticatedRequest, res: Response) => {
    const result = await cartService.getMyCart(
      req.user!.id,
      (req.query.page as unknown as number) || 1,
      (req.query.limit as unknown as number) || 10
    );

    res.status(200).json({ result });
  },

  // 🛒 [Cart] 장바구니 수량 수정 API
  updateQuantity: async (req: AuthenticatedRequest, res: Response) => {
    const { cartItemId, quantity } = req.body as { cartItemId: string; quantity: number };

    const result = await cartService.updateQuantity(req.user!.id, cartItemId, quantity);

    res.status(200).json({ message: '장바구니 상품 수량이 수정되었습니다.', result });
  },

  // 🛒 [Cart] 장바구니 삭제 API
  deleteFromCart: async (req: AuthenticatedRequest, res: Response) => {
    const { cartItemId } = req.body as { cartItemId: string };

    const returnData = await cartService.deleteFromCart(req.user!.id, cartItemId);

    res.status(200).json({ message: '장바구니에서 상품이 삭제되었습니다:', returnData });
  },
};
