import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const orders = await db.collection('orders').find().toArray();
  console.log("ORDERS:", JSON.stringify(orders, null, 2));
  mongoose.disconnect();
});
