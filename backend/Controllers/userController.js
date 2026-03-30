import User from '../Models/User.js';
import OTP from '../Models/OTP.js';
import jwt from 'jsonwebtoken';
import { sendOTPEmail } from '../utils/mailer.js';

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Generate and send 6-digit OTP
// @route   POST /api/users/send-otp
// @access  Public
export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Generate 6 digit numeric code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Wipe any existing OTPs for hygiene
        await OTP.deleteMany({ email });

        await OTP.create({
            email,
            otp: otpCode
        });

        // Fire Google SMTP Mailer
        const mailResult = await sendOTPEmail(email, otpCode);

        if (!mailResult.success) {
            return res.status(500).json({ message: 'Failed to send OTP verification email.', error: mailResult.error });
        }

        res.status(200).json({ message: 'Verification code sent successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new user (Post verification)
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, contact, otp } = req.body;

        if (!otp) {
            return res.status(400).json({ message: 'Verification Code (OTP) is required to finalize registration' });
        }

        const otpRecord = await OTP.findOne({ email, otp });

        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or Expired Verification Code' });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            contact,
        });

        if (user) {
            // Success, clean up the TTL index just in case manually
            await OTP.deleteMany({ email });

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                contact: user.contact,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data format' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                contact: user.contact,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                contact: user.contact,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
