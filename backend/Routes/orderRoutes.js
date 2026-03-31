import express from 'express';
import { createCheckoutInfo, verifyPayment, getSellerOrders, updateOrderStatus, getMyPurchases, getSellerProfit } from '../Controllers/orderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/checkout', protect, createCheckoutInfo);
router.post('/verify-payment', protect, verifyPayment);
router.get('/sales', protect, getSellerOrders);
router.get('/profit', protect, getSellerProfit);
router.put('/:orderId/item/:itemId/status', protect, updateOrderStatus);
router.get('/purchases', protect, getMyPurchases);

export default router;
