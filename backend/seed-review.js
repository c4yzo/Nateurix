import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from './Models/Review.js';
import Listing from './Models/Listing.js';
import Order from './Models/Order.js';

dotenv.config();

const seedReview = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB for seeding review.");

        // Need an order with Delivered status to legally seed a review based on our controller logic, 
        // but we can bypass the controller and just inject a review directly to test the UI.
        
        // Find existing listings
        const listings = await Listing.find({});
        if (listings.length === 0) {
            console.log("No listings found.");
            process.exit(1);
        }
        
        const testListing = listings[0];
        
        // Find a user who is NOT the seller to act as a reviewer
        // Try to find the second user
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        const reviewer = users.find(u => u._id.toString() !== testListing.seller.toString());

        if (!reviewer) {
             console.log("Could not find a valid reviewer.");
             process.exit(1);
        }

        // Delete existing reviews for this listing to avoid unique constraint errors during testing
        await Review.deleteMany({ listing: testListing._id });
        
        const newReview = await Review.create({
            listing: testListing._id,
            user: reviewer._id,
            rating: 5,
            comment: "This is a fantastic plant! It arrived perfectly packaged and looks even better in person. Completely verified purchase, would buy again."
        });

        // Update the listing stats manually like the controller would
        testListing.numReviews = 1;
        testListing.averageRating = 5;
        await testListing.save();

        console.log(`Successfully seeded a 5-star review from ${reviewer.name} onto "${testListing.title}"!`);
        process.exit();

    } catch (error) {
        console.error("Error connecting or seeding.", error);
        process.exit(1);
    }
}

seedReview();
