import Order from '../Models/Order.js';
import RentalOrder from '../Models/RentalOrder.js';
import Cart from '../Models/Cart.js';
import Listing from '../Models/Listing.js';
import crypto from 'crypto';

// @desc    Create new order & generate mock transaction
// @route   POST /api/orders/checkout
// @access  Private
export const createCheckoutInfo = async (req, res) => {
    try {
        const { shippingAddress } = req.body;

        if (!shippingAddress || !shippingAddress.address || !shippingAddress.city) {
            return res.status(400).json({ message: 'Valid shipping address is required.' });
        }

        const cart = await Cart.findOne({ user: req.user._id }).populate('items.listing');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty' });
        }

        let totalPrice = 0;
        const orderItems = [];
        const rentalItemsBySeller = {};

        for (const item of cart.items) {
            if (!item.listing) continue;

            if (item.quantity > item.listing.stockCount) {
                return res.status(400).json({
                    message: `Not enough stock for ${item.listing.title}. Only ${item.listing.stockCount} left.`
                });
            }

            const itemPrice = item.listing.price;
            let transactionType = item.listing.transactionType || 'Sale';

            // Standardize case to handle lowercase DB entries
            if (transactionType.toLowerCase() === 'rent') transactionType = 'Rent';
            if (transactionType.toLowerCase() === 'sale') transactionType = 'Sale';

            // Nateurix Platform Rules: Tools are inherently Rentals
            if (item.listing.category === 'Tool') {
                transactionType = 'Rent';
            }

            const daysRented = item.daysRented || 1;

            if (transactionType === 'Rent') {
                totalPrice += itemPrice * item.quantity * daysRented;
            } else {
                totalPrice += itemPrice * item.quantity;
            }

            const itemPickupAddress = item.listing.pickupAddress || 'LEGACY_ITEM_NO_ADDRESS';

            if (transactionType === 'Rent') {
                const sellerId = item.listing.seller.toString();
                if (!rentalItemsBySeller[sellerId]) {
                    rentalItemsBySeller[sellerId] = [];
                }
                rentalItemsBySeller[sellerId].push({
                    listing: item.listing._id,
                    quantity: item.quantity,
                    daysRented: daysRented,
                    pricePerDay: itemPrice,
                    pickupAddress: itemPickupAddress
                });
            } else {
                orderItems.push({
                    listing: item.listing._id,
                    quantity: item.quantity,
                    price: itemPrice,
                    pickupAddress: itemPickupAddress
                });
            }
        }

        if (orderItems.length === 0 && Object.keys(rentalItemsBySeller).length === 0) {
            return res.status(400).json({ message: 'No valid items in cart to checkout.' });
        }

        let createdStandardOrderId = null;
        let createdRentalOrderIds = [];

        if (orderItems.length > 0) {
            const order = new Order({
                user: req.user._id,
                orderItems,
                shippingAddress,
                totalPrice: orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
                paymentStatus: 'Pending'
            });
            const createdOrder = await order.save();
            createdStandardOrderId = createdOrder._id;
        }

        for (const sellerId in rentalItemsBySeller) {
            const rentedItems = rentalItemsBySeller[sellerId];
            const rentalTotal = rentedItems.reduce((acc, item) => acc + (item.pricePerDay * item.quantity * item.daysRented), 0);

            const rentalOrder = new RentalOrder({
                buyer: req.user._id,
                seller: sellerId,
                rentedItems,
                shippingAddress,
                totalPaid: rentalTotal,
                rentalStatus: 'Pending'
            });
            const createdRental = await rentalOrder.save();
            createdRentalOrderIds.push(createdRental._id);
        }

        const mockTransactionId = `txn_mock_${crypto.randomBytes(8).toString('hex')}`;

        res.status(201).json({
            orderId: createdStandardOrderId,
            rentalOrderIds: createdRentalOrderIds,
            transactionId: mockTransactionId,
            totalPrice,
            message: 'Checkout initialized. Awaiting payment.',
        });

    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify payment signature and process order
// @route   POST /api/orders/verify-payment
// @access  Private
export const verifyPayment = async (req, res) => {
    try {
        const { orderId, rentalOrderIds, transactionId, signature } = req.body;

        if (!signature || signature !== 'mock_success_signature') {
            return res.status(400).json({ message: 'Invalid payment signature. Payment failed or was tampered with.' });
        }

        if (orderId) {
            const order = await Order.findById(orderId);
            if (order && order.paymentStatus !== 'Completed') {
                order.paymentStatus = 'Completed';
                order.paymentTransactionId = transactionId;
                await order.save();

                for (const item of order.orderItems) {
                    const listing = await Listing.findById(item.listing);
                    if (listing) {
                        listing.stockCount = Math.max(0, listing.stockCount - item.quantity);
                        if (listing.stockCount === 0 && listing.category !== 'Tool') {
                            listing.status = 'Sold';
                        }
                        await listing.save();
                    }
                }
            }
        }

        if (rentalOrderIds && rentalOrderIds.length > 0) {
            for (const rId of rentalOrderIds) {
                const rentalOrder = await RentalOrder.findById(rId);
                // rentalStatus starts at Pending
                if (rentalOrder && !rentalOrder.paymentTransactionId) {
                    rentalOrder.paymentTransactionId = transactionId;
                    await rentalOrder.save();

                    for (const item of rentalOrder.rentedItems) {
                        const listing = await Listing.findById(item.listing);
                        if (listing) {
                            listing.stockCount = Math.max(0, listing.stockCount - item.quantity);
                            if (listing.stockCount === 0) {
                                listing.status = 'Rented';
                            }
                            await listing.save();
                        }
                    }
                }
            }
        }

        await Cart.findOneAndUpdate(
            { user: req.user._id },
            { $set: { items: [] } }
        );

        res.status(200).json({
            message: 'Payment verified successfully. Order complete.',
            orderId: orderId || (rentalOrderIds && rentalOrderIds[0])
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders where the current user is managing at least one item
// @route   GET /api/orders/sales
// @access  Private
export const getSellerOrders = async (req, res) => {
    try {
        // Fetch all completed or later orders
        const orders = await Order.find({ paymentStatus: 'Completed' })
            .populate({
                path: 'orderItems.listing',
                select: 'title imageUrl price seller',
            })
            .populate('user', 'name email address')
            .sort({ createdAt: -1 });

        // Filter standard physical orders
        const sellerOrders = orders.filter(order =>
            order.orderItems.some(item =>
                item.listing && item.listing.seller && item.listing.seller.toString() === req.user._id.toString()
            )
        );

        // Fetch tool rentals where the user is the Seller
        const rentals = await RentalOrder.find({ seller: req.user._id })
            .populate('rentedItems.listing', 'title imageUrl price')
            .populate('buyer', 'name email address')
            .sort({ createdAt: -1 })
            .lean();

        // Soft-map Rental object schema to exactly match standard Order schema so frontend doesn't crash
        const mappedRentals = rentals.map(rental => ({
            _id: rental._id,
            createdAt: rental.createdAt,
            totalPrice: rental.totalPaid,
            isRental: true,
            user: rental.buyer,  // Maps 'buyer' directly to 'user' for frontend
            shippingAddress: rental.shippingAddress,
            orderItems: rental.rentedItems.map(item => ({
                _id: item._id,
                listing: { ...item.listing, seller: req.user._id }, // Ensures UI filter passes
                quantity: item.quantity,
                price: item.pricePerDay * item.daysRented,
                deliveryStatus: rental.rentalStatus, // Pass rental constraint directly down
            }))
        }));

        // Combine and sort chronologically
        const combined = [...sellerOrders, ...mappedRentals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(combined);
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get total profit for a seller (sales + rentals)
// @route   GET /api/orders/profit
// @access  Private
export const getSellerProfit = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Calculate Standard Sales Profit
        const orders = await Order.find({ paymentStatus: 'Completed' })
            .populate('orderItems.listing');

        let salesProfit = 0;
        orders.forEach(order => {
            order.orderItems.forEach(item => {
                if (item.listing && item.listing.seller && item.listing.seller.toString() === userId.toString()) {
                    salesProfit += (item.price * item.quantity);
                }
            });
        });

        // 2. Calculate Tool Rentals Profit
        const rentals = await RentalOrder.find({ seller: userId, paymentTransactionId: { $ne: null } });
        const rentalsProfit = rentals.reduce((acc, rental) => acc + rental.totalPaid, 0);

        const totalProfit = salesProfit + rentalsProfit;

        res.json({ totalProfit, salesProfit, rentalsProfit });
    } catch (error) {
        console.error('Error calculating seller profit:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order item delivery status
// @route   PUT /api/orders/:orderId/item/:itemId/status
// @access  Private
export const updateOrderStatus = async (req, res) => {
    try {
        const { deliveryStatus } = req.body;
        const { orderId, itemId } = req.params;

        const order = await Order.findById(orderId).populate('orderItems.listing');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const item = order.orderItems.id(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found in order' });
        }

        // Verify the user owns this specific item
        if (item.listing && item.listing.seller && item.listing.seller.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this item' });
        }

        if (!['Processing', 'Shipped', 'Delivered'].includes(deliveryStatus)) {
            return res.status(400).json({ message: 'Invalid delivery status' });
        }

        const currentStatus = item.deliveryStatus || 'Processing';
        const validTransitions = {
            'Processing': ['Processing', 'Shipped', 'Delivered'],
            'Shipped': ['Shipped', 'Delivered'],
            'Delivered': ['Delivered']
        };

        if (!validTransitions[currentStatus].includes(deliveryStatus)) {
            return res.status(400).json({ message: 'Cannot revert to a previous delivery status' });
        }

        item.deliveryStatus = deliveryStatus;
        const updatedOrder = await order.save();

        res.json(updatedOrder);

    } catch (error) {
        console.error('Error updating order item:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's purchase history
// @route   GET /api/orders/purchases
// @access  Private
export const getMyPurchases = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user._id,
            paymentStatus: { $in: ['Completed', 'Pending'] } // Or just Completed
        })
            .populate('orderItems.listing', 'title imageUrl price')
            .sort({ createdAt: -1 })
            .lean();

        const rentals = await RentalOrder.find({
            buyer: req.user._id
        })
            .populate('rentedItems.listing', 'title imageUrl price')
            .sort({ createdAt: -1 })
            .lean();

        const mappedRentals = rentals.map(rental => ({
            _id: rental._id,
            createdAt: rental.createdAt,
            totalPrice: rental.totalPaid,
            isRental: true,
            orderItems: rental.rentedItems.map(item => ({
                _id: item._id,
                listing: item.listing,
                quantity: item.quantity,
                // Make the price calculation work with frontend (price * quantity)
                price: item.pricePerDay * item.daysRented,
                deliveryStatus: rental.rentalStatus,
            }))
        }));

        const combined = [...orders, ...mappedRentals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(combined);
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ message: error.message });
    }
};
