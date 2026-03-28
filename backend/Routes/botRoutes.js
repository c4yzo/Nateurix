import express from 'express';
import { askAgriBot } from '../Controllers/botController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/ask-agribot', protect, askAgriBot);

export default router;
