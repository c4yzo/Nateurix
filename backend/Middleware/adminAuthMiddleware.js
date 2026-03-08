import jwt from 'jsonwebtoken';
import Admin from '../Models/Admin.js';

const protectAdmin = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            // Decode token using secret
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find the admin in the dedicated Admin collection
            req.admin = await Admin.findById(decoded.id).select('-password');

            if (!req.admin) {
                res.status(401).json({ message: 'Not authorized, admin not found' });
                return;
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export { protectAdmin };
