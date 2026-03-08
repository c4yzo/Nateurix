import express from 'express';
import {
    createListing,
    getListings,
    getListingById,
    getMyListings,
    updateListing,
    updateListingStatus,
    deleteListing,
} from '../Controllers/listingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(getListings).post(protect, createListing);
router.route('/my-listings').get(protect, getMyListings);
router.route('/:id/status').patch(protect, updateListingStatus);
router.route('/:id')
    .get(getListingById)
    .put(protect, updateListing)
    .delete(protect, deleteListing);

export default router;
