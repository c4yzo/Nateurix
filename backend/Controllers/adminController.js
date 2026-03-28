import Admin from '../Models/Admin.js';
import Order from '../Models/Order.js';
import RentalOrder from '../Models/RentalOrder.js';
import Listing from '../Models/Listing.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
export const adminLogin = async (req, res) => {
    // Temporary logic to seed an admin if none exist
    const adminCount = await Admin.countDocuments({});
    if (adminCount === 0) {
        const seedAdmin = new Admin({
            email: 'admin@nateurix.com',
            password: 'Abhi@123'
        });
        await seedAdmin.save();
    }

    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (admin && (await admin.matchPassword(password))) {
        res.json({
            _id: admin._id,
            email: admin.email,
            token: generateToken(admin._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Get all orders for dashboard
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'name email')
            .populate({
                path: 'orderItems.listing',
                select: 'title imageUrl category pickupAddress seller',
                populate: {
                    path: 'seller',
                    select: 'name email contact'
                }
            })
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order item delivery status
// @route   PUT /api/admin/orders/:orderId/item/:itemId/status
// @access  Private/Admin
export const updateOrderItemStatus = async (req, res) => {
    try {
        const { deliveryStatus } = req.body;
        const { orderId, itemId } = req.params;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const item = order.orderItems.id(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found in order' });
        }

        if (!['Processing', 'Shipped', 'Delivered'].includes(deliveryStatus)) {
            return res.status(400).json({ message: 'Invalid delivery status' });
        }

        const currentStatus = item.deliveryStatus || 'Processing';
        if (currentStatus === 'Delivered') {
            return res.status(400).json({ message: 'Cannot change status of a delivered item' });
        }
        if (currentStatus === 'Shipped' && deliveryStatus === 'Processing') {
            return res.status(400).json({ message: 'Cannot revert a shipped item back to processing' });
        }

        item.deliveryStatus = deliveryStatus;
        const updatedOrder = await order.save();

        res.json(updatedOrder);

    } catch (error) {
        console.error('Error updating order item by admin:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all rentals for dashboard
// @route   GET /api/admin/rentals
// @access  Private/Admin
export const getAllRentals = async (req, res) => {
    try {
        const rentals = await RentalOrder.find({})
            .populate('buyer', 'name email contact')
            .populate('seller', 'name email contact')
            .populate({
                path: 'rentedItems.listing',
                select: 'title imageUrl category pickupAddress transactionType',
            })
            .sort({ createdAt: -1 });

        res.json(rentals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update rental status and handle stock restoration
// @route   PUT /api/admin/rentals/:rentalId/status
// @access  Private/Admin
export const updateRentalStatus = async (req, res) => {
    try {
        const { rentalStatus } = req.body;
        const { rentalId } = req.params;

        const rental = await RentalOrder.findById(rentalId);

        if (!rental) {
            return res.status(404).json({ message: 'Rental Order not found' });
        }

        const validStatuses = ['Pending', 'Delivering to Buyer', 'Active', 'Collecting from Buyer', 'Returning to Seller', 'Completed'];
        if (!validStatuses.includes(rentalStatus)) {
            return res.status(400).json({ message: 'Invalid rental status' });
        }

        // Prevent updating if already completed
        if (rental.rentalStatus === 'Completed') {
            return res.status(400).json({ message: 'Cannot modify a completed rental order' });
        }

        const currentIdx = validStatuses.indexOf(rental.rentalStatus);
        const newIdx = validStatuses.indexOf(rentalStatus);

        if (newIdx < currentIdx) {
            return res.status(400).json({ message: 'Cannot revert rental status backwards.' });
        }

        // STOCK RESTORATION LOGIC
        // If the new status is Completed, immediately inject the rented quantity back into the system
        if (rentalStatus === 'Completed') {
            for (const item of rental.rentedItems) {
                const listing = await Listing.findById(item.listing);
                if (listing) {
                    listing.stockCount += item.quantity;

                    // If the listing was 'Rented' out to 0, it might now be available again
                    if (listing.stockCount > 0 && listing.status === 'Rented') {
                        listing.status = 'Available';
                    }

                    await listing.save();
                }
            }
        }

        rental.rentalStatus = rentalStatus;
        const updatedRental = await rental.save();

        res.json(updatedRental);

    } catch (error) {
        console.error('Error updating rental status:', error);
        res.status(500).json({ message: error.message });
    }
};
