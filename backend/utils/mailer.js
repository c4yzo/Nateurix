import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendOTPEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: `"Nateurix Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Nateurix Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #2F5233; margin: 0;">Nateurix</h2>
                        <p style="color: #718096; margin-top: 5px;">Cultivate Your Green Space</p>
                    </div>
                    
                    <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; text-align: center;">
                        <p style="font-size: 16px; color: #2d3748; margin-bottom: 15px;">Please use the following 6-digit code to verify your email address and complete your registration:</p>
                        <h1 style="font-size: 36px; letter-spacing: 5px; color: #94C973; background: #ffffff; padding: 10px 20px; border-radius: 8px; display: inline-block; margin: 0; border: 1px solid #e2e8f0;">
                            ${otp}
                        </h1>
                        <p style="font-size: 14px; color: #e53e3e; margin-top: 15px; font-weight: bold;">This code will expire in 5 minutes.</p>
                    </div>
                    
                    <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #a0aec0;">
                        <p>If you did not request this verification code, please ignore this email.</p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        return { success: true, result };
    } catch (error) {
        console.error('Nodemailer Error:', error);
        return { success: false, error: error.message };
    }
};
