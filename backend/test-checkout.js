import mongoose from 'mongoose';
import { createCheckoutInfo, verifyPayment } from './Controllers/orderController.js';
import User from './Models/User.js';
import Cart from './Models/Cart.js';
import Listing from './Models/Listing.js';

async function run() {
    await mongoose.connect('mongodb://127.0.0.1:27017/nateurix');

    // Setup Mock Req/Res
    const user = await User.findOne({ email: 'abhijith@gmail.com' });
    const req = {
        user: user,
        body: { shippingAddress: { address: 'Test', city: 'City' } }
    };

    // Clear cart and push one item
    const listing = await Listing.findOne({ status: 'Available' });
    if (!listing) return console.log("No listings");
    await Cart.findOneAndUpdate({ user: user._id }, { items: [{ listing: listing._id, quantity: 1, daysRented: 2 }] }, { upsert: true });

    let checkoutBody = null;
    const res = {
        status: (code) => res,
        json: (data) => { console.log("RES JSON:", data); checkoutBody = data; return res; }
    };

    console.log("--- CREATING CHECKOUT INFO ---");
    await createCheckoutInfo(req, res);

    if (checkoutBody && checkoutBody.orderId || (checkoutBody && checkoutBody.rentalOrderIds)) {
        console.log("--- VERIFYING PAYMENT ---");
        const vReq = {
            user: user,
            body: {
                orderId: checkoutBody.orderId,
                rentalOrderIds: checkoutBody.rentalOrderIds,
                transactionId: checkoutBody.transactionId,
                signature: 'mock_success_signature'
            }
        };
        const vRes = { status: (c) => vRes, json: (d) => { console.log("VERIFY RES:", d); } };
        await verifyPayment(vReq, vRes);
    }

    process.exit(0);
}
run();
