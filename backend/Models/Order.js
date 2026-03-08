import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Listing',
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
    },
    // We snapshot the price here so historic orders don't change if listing price changes later
    price: {
        type: Number,
        required: true,
    },
    deliveryStatus: {
        type: String,
        required: true,
        enum: ['Processing', 'Shipped', 'Delivered'],
        default: 'Processing',
    },
    pickupAddress: {
        type: String,
        required: true,
    }
});

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        orderItems: [orderItemSchema],
        shippingAddress: {
            address: { type: String, required: true },
            city: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true },
        },
        totalPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        paymentStatus: {
            type: String,
            required: true,
            enum: ['Pending', 'Completed', 'Failed'],
            default: 'Pending',
        },
        paymentTransactionId: {
            type: String,
            // Only populated when a payment is actually attempted/successful
        }
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
