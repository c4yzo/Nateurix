import mongoose from 'mongoose';
import Listing from './Models/Listing.js';
async function run() {
    await mongoose.connect('mongodb://127.0.0.1:27017/nateurix');
    const logs = await Listing.find().limit(2);
    console.log("Listings:", logs.length);
    process.exit(0);
}
run();
