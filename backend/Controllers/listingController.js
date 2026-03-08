import Listing from '../Models/Listing.js';

// @desc    Create a listng
// @route   POST /api/listings
// @access  Private
export const createListing = async (req, res) => {
    try {
        const { title, description, category, price, stockCount, imageUrl, pickupAddress } = req.body;

        const listing = new Listing({
            title,
            description,
            category,
            price,
            stockCount: stockCount || 1,
            imageUrl,
            pickupAddress,
            seller: req.user._id, // Set the seller to the logged in user
        });

        const createdListing = await listing.save();
        res.status(201).json(createdListing);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch all listings (with optional search & category filtering)
// @route   GET /api/listings
// @access  Public
export const getListings = async (req, res) => {
    try {
        const keyword = req.query.search
            ? {
                title: {
                    $regex: req.query.search,
                    $options: 'i',
                },
            }
            : {};

        const categoryFilter = req.query.category && req.query.category !== 'All'
            ? { category: req.query.category }
            : {};

        // Combine filters
        const query = { ...keyword, ...categoryFilter, status: 'Available' };

        const listings = await Listing.find(query).populate('seller', 'name email');
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch single listing
// @route   GET /api/listings/:id
// @access  Public
export const getListingById = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id).populate(
            'seller',
            'name email contact'
        );

        if (listing) {
            res.json(listing);
        } else {
            res.status(404).json({ message: 'Listing not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user listings
// @route   GET /api/listings/my-listings
// @access  Private
export const getMyListings = async (req, res) => {
    try {
        const listings = await Listing.find({ seller: req.user._id }).populate('seller', 'name email');
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a listing
// @route   PUT /api/listings/:id
// @access  Private
export const updateListing = async (req, res) => {
    try {
        const { description, price, stockCount, imageUrl, pickupAddress } = req.body;

        const listing = await Listing.findById(req.params.id);

        if (listing) {
            // Check if user is owner
            if (listing.seller.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'User not authorized to update this listing' });
            }

            // Note: Title and Category are explicitly NOT updatable after creation
            listing.description = description || listing.description;
            listing.price = price || listing.price;
            listing.stockCount = stockCount !== undefined ? stockCount : listing.stockCount;
            listing.imageUrl = imageUrl || listing.imageUrl;
            listing.pickupAddress = pickupAddress || listing.pickupAddress;

            // Reset status if category changes and conflicts
            if (listing.status === 'Rented' && listing.category !== 'Tool') {
                listing.status = 'Available';
            } else if (listing.status === 'Sold' && listing.category === 'Tool') {
                listing.status = 'Available';
            }

            const updatedListing = await listing.save();
            res.json(updatedListing);
        } else {
            res.status(404).json({ message: 'Listing not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update listing status
// @route   PATCH /api/listings/:id/status
// @access  Private
export const updateListingStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const listing = await Listing.findById(req.params.id);

        if (listing) {
            // Check if user is owner
            if (listing.seller.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'User not authorized to update this listing' });
            }

            // Ensure valid status
            if (!['Available', 'Sold', 'Rented'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status value' });
            }

            if (status === 'Sold' && listing.category === 'Tool') {
                return res.status(400).json({ message: 'Tools can only be rented.' });
            }

            if (status === 'Rented' && listing.category !== 'Tool') {
                return res.status(400).json({ message: 'Only tools can be rented.' });
            }

            listing.status = status;

            const updatedListing = await listing.save();
            res.json(updatedListing);
        } else {
            res.status(404).json({ message: 'Listing not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a listing
// @route   DELETE /api/listings/:id
// @access  Private
export const deleteListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (listing) {
            // Check if user is owner
            if (listing.seller.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'User not authorized to delete this listing' });
            }

            // Using deleteOne to remove
            await listing.deleteOne();
            res.json({ message: 'Listing removed' });
        } else {
            res.status(404).json({ message: 'Listing not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
