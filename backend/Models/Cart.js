import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Listing',
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: [1, 'Quantity cannot be less than 1'],
    },
    daysRented: {
        type: Number,
        required: true,
        default: 1,
        min: [1, 'Days rented cannot be less than 1'],
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true, // One cart per user
    },
    items: [cartItemSchema]
}, {
    timestamps: true,
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
