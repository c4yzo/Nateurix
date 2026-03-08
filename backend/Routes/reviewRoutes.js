import express from 'express';
import { createReview, getListingReviews } from '../Controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/:listingId', protect, createReview);
router.get('/:listingId', getListingReviews);

export default router;
