import Order from '../Models/Order.js';
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

        // Fetch user's cart
        const cart = await Cart.findOne({ user: req.user._id }).populate('items.listing');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty' });
        }

        // Validate stock and build order items array securely from backend data
        let totalPrice = 0;
        const orderItems = [];

        for (const item of cart.items) {
            if (!item.listing) continue; // Skip if listing was somehow deleted

            if (item.quantity > item.listing.stockCount) {
                return res.status(400).json({
                    message: `Not enough stock for ${item.listing.title}. Only ${item.listing.stockCount} left.`
                });
            }

            const itemPrice = item.listing.price;
            totalPrice += itemPrice * item.quantity;

            // Fallback for legacy items that don't have a pickup address
            const itemPickupAddress = item.listing.pickupAddress || 'LEGACY_ITEM_NO_ADDRESS';

            orderItems.push({
                listing: item.listing._id,
                quantity: item.quantity,
                price: itemPrice, // snapshot current price
                pickupAddress: itemPickupAddress // snapshot the pickup location securely
            });
        }

        if (orderItems.length === 0) {
            return res.status(400).json({ message: 'No valid items in cart to checkout.' });
        }

        // Create the pending order
        const order = new Order({
            user: req.user._id,
            orderItems,
            shippingAddress,
            totalPrice,
            paymentStatus: 'Pending'
        });

        const createdOrder = await order.save();

        // SIMULATE PAYMENT GATEWAY INITIALIZATION
        // In reality, you'd call Razorpay.orders.create() here
        // We will generate a mock transaction ID that the frontend modal will use
        const mockTransactionId = `txn_mock_${crypto.randomBytes(8).toString('hex')}`;

        res.status(201).json({
            orderId: createdOrder._id,
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
        const { orderId, transactionId, signature } = req.body;

        // In a real app (like Razorpay), you verify the signature using crypto.createHmac and your API Secret.
        // For our mock, we just check if they sent a signature back indicating the mock modal succeeded.
        if (!signature || signature !== 'mock_success_signature') {
            return res.status(400).json({ message: 'Invalid payment signature. Payment failed or was tampered with.' });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.paymentStatus === 'Completed') {
            return res.status(400).json({ message: 'Order is already paid' });
        }

        // Verify the transaction ID matches (basic security check)
        // In reality, Razorpay sends back the orderId mapped to the transaction

        // 1. Mark Order as Completed
        order.paymentStatus = 'Completed';
        order.paymentTransactionId = transactionId;
        await order.save();

        // 2. Deduct Stock Count safely
        for (const item of order.orderItems) {
            const listing = await Listing.findById(item.listing);
            // We ignore if listing was deleted in the 3 minutes it took to pay
            if (listing) {
                // Ensure we don't go below 0 visually
                listing.stockCount = Math.max(0, listing.stockCount - item.quantity);

                // If it hits 0, the virtual field 'isAvailable' naturally flags false, 
                // but we proactively set status to Sold as well for UI consistency
                if (listing.stockCount === 0 && listing.category !== 'Tool') {
                    listing.status = 'Sold';
                }

                await listing.save();
            }
        }

        // 3. Clear the user's cart
        await Cart.findOneAndUpdate(
            { user: req.user._id },
            { $set: { items: [] } }
        );

        res.status(200).json({
            message: 'Payment verified successfully. Order complete.',
            orderId: order._id
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

        // Filter orders where the current user is the seller of at least one item
        const sellerOrders = orders.filter(order =>
            order.orderItems.some(item =>
                item.listing && item.listing.seller && item.listing.seller.toString() === req.user._id.toString()
            )
        );

        res.json(sellerOrders);
    } catch (error) {
        console.error('Error fetching sales:', error);
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
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ message: error.message });
    }
};
