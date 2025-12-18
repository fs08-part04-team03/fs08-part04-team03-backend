import { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/types/common.types';
import { cartService } from './cart.service';

export const cartController = {
  // 🛒 [Cart] 장바구니에 상품 추가 API
  addToCart: async (req: AuthenticatedRequest, res: Response) => {
    const { productId, quantity } = req.body as { productId: number; quantity: number };

    const result = await cartService.addToCart(req.user!.id, productId, quantity);

    // ResponseUtil.success 구조: { success, data: { isNew, ... }, message }
    res.status(201).json(result);
  },

  // 🛒 [Cart] 내 장바구니 조회 API
  getMyCart: async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await cartService.getMyCart(req.user!.id, page, limit);

    res.status(200).json(result);
  },

  // 🛒 [Cart] 장바구니 수량 수정 API
  updateQuantity: async (req: AuthenticatedRequest, res: Response) => {
    const { cartItemId, quantity } = req.body as { cartItemId: string; quantity: number };

    const result = await cartService.updateQuantity(req.user!.id, cartItemId, quantity);

    res.status(200).json(result);
  },

  // 🛒 [Cart] 장바구니 삭제 API
  deleteFromCart: async (req: AuthenticatedRequest, res: Response) => {
    const { cartItemId } = req.body as { cartItemId: string };

    const result = await cartService.deleteFromCart(req.user!.id, cartItemId);

    res.status(200).json(result);
  },

  // 🛒 [Cart] 장바구니 다중 삭제 API
  deleteMultipleFromCart: async (req: AuthenticatedRequest, res: Response) => {
    const { cartItemIds } = req.body as { cartItemIds: string[] };

    const result = await cartService.deleteMultipleFromCart(req.user!.id, cartItemIds);

    res.status(200).json(result);
  },
};
