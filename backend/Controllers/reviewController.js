import Listing from '../Models/Listing.js';
import Review from '../Models/Review.js';
import Order from '../Models/Order.js';

// @desc    Create new review
// @route   POST /api/reviews/:listingId
// @access  Private
export const createReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const listingId = req.params.listingId;
        const userId = req.user._id;

        // 1. Verify listing exists
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        if (listing.seller.toString() === userId.toString()) {
            return res.status(400).json({ message: 'Sellers cannot review their own listings' });
        }

        // 2. Verify user has purchased this item and it is 'Delivered'
        // Find any order by this user that contains this listing with deliveryStatus 'Delivered'
        const orders = await Order.find({ user: userId });

        let hasPurchasedAndDelivered = false;

        for (const order of orders) {
            const deliveredItem = order.orderItems.find(item =>
                item.listing &&
                item.listing.toString() === listingId &&
                item.deliveryStatus === 'Delivered'
            );
            if (deliveredItem) {
                hasPurchasedAndDelivered = true;
                break;
            }
        }

        if (!hasPurchasedAndDelivered) {
            return res.status(400).json({
                message: 'You can only review items you have purchased and received (Delivered)'
            });
        }

        // 3. Verify user hasn't already reviewed this listing
        const alreadyReviewed = await Review.findOne({
            listing: listingId,
            user: userId
        });

        if (alreadyReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this listing' });
        }

        // 4. Create review
        const review = new Review({
            listing: listingId,
            user: userId,
            rating: Number(rating),
            comment,
        });

        await review.save();

        // 5. Update listing rating stats
        const reviews = await Review.find({ listing: listingId });

        listing.numReviews = reviews.length;
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
            listing.averageRating = totalRating / reviews.length;
        } else {
            listing.averageRating = 0;
        }

        await listing.save();

        res.status(201).json({ message: 'Review added successfully', review });

    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get reviews for a listing
// @route   GET /api/reviews/:listingId
// @access  Public
export const getListingReviews = async (req, res) => {
    try {
        const listingId = req.params.listingId;

        const reviews = await Review.find({ listing: listingId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: error.message });
    }
};
