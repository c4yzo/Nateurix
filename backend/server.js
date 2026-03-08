import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import userRoutes from './Routes/userRoutes.js';
import listingRoutes from './Routes/listingRoutes.js';
import uploadRoutes from './Routes/uploadRoutes.js';
import cartRoutes from './Routes/cartRoutes.js';
import orderRoutes from './Routes/orderRoutes.js';
import reviewRoutes from './Routes/reviewRoutes.js';
import adminRoutes from './Routes/adminRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

connectDB();

// Basic route
app.get('/api', (req, res) => {
    res.send('Nateurix API is running');
});

// User Routes
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
