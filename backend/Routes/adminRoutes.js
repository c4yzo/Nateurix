import express from 'express';
import { adminLogin, getAllOrders, updateOrderItemStatus } from '../Controllers/adminController.js';
import { protectAdmin } from '../Middleware/adminAuthMiddleware.js';

const router = express.Router();

router.post('/login', adminLogin);
router.get('/orders', protectAdmin, getAllOrders);
router.put('/orders/:orderId/item/:itemId/status', protectAdmin, updateOrderItemStatus);

export default router;
