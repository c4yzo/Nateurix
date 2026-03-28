import express from 'express';
import { adminLogin, getAllOrders, updateOrderItemStatus, getAllRentals, updateRentalStatus } from '../Controllers/adminController.js';
import { protectAdmin } from '../Middleware/adminAuthMiddleware.js';

const router = express.Router();

router.post('/login', adminLogin);
router.get('/orders', protectAdmin, getAllOrders);
router.put('/orders/:orderId/item/:itemId/status', protectAdmin, updateOrderItemStatus);
router.get('/rentals', protectAdmin, getAllRentals);
router.put('/rentals/:rentalId/status', protectAdmin, updateRentalStatus);

export default router;
