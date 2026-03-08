import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['Plant', 'Seed', 'Tool', 'Fertilizer'],
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    imageUrl: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Available', 'Sold', 'Rented'],
        default: 'Available',
    },
    stockCount: {
        type: Number,
        required: true,
        default: 1,
        min: [0, 'Stock cannot be less than 0']
    },
    averageRating: {
        type: Number,
        required: true,
        default: 0,
    },
    numReviews: {
        type: Number,
        required: true,
        default: 0,
    },
    pickupAddress: {
        type: String,
        required: true,
    }
}, {
    timestamps: true,
});

// Add a virtual field for 'isAvailable' based on stockCount
listingSchema.virtual('isAvailable').get(function () {
    return this.stockCount > 0 && this.status === 'Available';
});

// Ensure virtuals are included when converted to JSON
listingSchema.set('toJSON', { virtuals: true });
listingSchema.set('toObject', { virtuals: true });
const Listing = mongoose.model('Listing', listingSchema);
export default Listing;
