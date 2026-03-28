import mongoose from 'mongoose';

const rentedItemSchema = new mongoose.Schema({
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
    daysRented: {
        type: Number,
        required: true,
        default: 1,
    },
    pricePerDay: {
        type: Number,
        required: true,
    },
    pickupAddress: {
        type: String,
        required: true,
    }
});

const rentalOrderSchema = new mongoose.Schema(
    {
        buyer: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // Groups items by seller inherently
        },
        rentedItems: [rentedItemSchema],
        shippingAddress: {
            address: { type: String, required: true },
            city: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true },
        },
        totalPaid: {
            type: Number,
            required: true,
            default: 0.0,
        },
        rentalStatus: {
            type: String,
            required: true,
            enum: ['Pending', 'Delivering to Buyer', 'Active', 'Collecting from Buyer', 'Returning to Seller', 'Completed'],
            default: 'Pending',
        },
        paymentTransactionId: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

const RentalOrder = mongoose.model('RentalOrder', rentalOrderSchema);

export default RentalOrder;
