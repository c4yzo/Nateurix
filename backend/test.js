import mongoose from 'mongoose';
import Order from './Models/Order.js';
import RentalOrder from './Models/RentalOrder.js';

async function test() {
    await mongoose.connect('mongodb://127.0.0.1:27017/nateurix');
    
    // Check validation of rental order schema
    try {
        const rentalOrder = new RentalOrder({
            buyer: new mongoose.Types.ObjectId(),
            seller: new mongoose.Types.ObjectId(),
            rentedItems: [{
                 listing: new mongoose.Types.ObjectId(),
                 quantity: 1,
                 daysRented: 3,
                 pricePerDay: 10,
                 pickupAddress: "Test Address"
            }],
            shippingAddress: {
                 address: '123 Test',
                 city: 'Test City',
                 postalCode: '12345',
                 country: 'India'
            },
            totalPaid: 30,
            rentalStatus: 'Pending'
        });
        await rentalOrder.validate();
        console.log("Validation passed");
    } catch(err) {
        console.log("Validation failed", err);
    }
    process.exit(0);
}
test();
