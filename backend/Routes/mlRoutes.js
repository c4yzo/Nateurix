import express from 'express';
import { identifyPlant, upload } from '../Controllers/mlController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/identify-plant', protect, upload.single('image'), identifyPlant);

export default router;
