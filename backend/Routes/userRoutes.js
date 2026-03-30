import express from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    sendOtp,
} from '../Controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);

export default router;
