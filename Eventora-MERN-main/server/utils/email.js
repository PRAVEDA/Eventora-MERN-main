const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Checks whether valid email credentials have been configured in .env
 */
const isEmailConfigured = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    return Boolean(
        user &&
        pass &&
        user.trim() !== '' &&
        user !== '@gmail.com' &&
        user.includes('@') &&
        pass.trim() !== ''
    );
};

let transporter = null;

const getTransporter = () => {
    if (!isEmailConfigured()) return null;
    if (transporter) return transporter;

    if (process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim(),
                pass: (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, '')
            },
            connectionTimeout: 8000,
            socketTimeout: 10000
        });
    } else {
        transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: (process.env.EMAIL_USER || '').trim(),
                pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, '')
            },
            connectionTimeout: 8000,
            socketTimeout: 10000
        });
    }

    return transporter;
};

/**
 * Sends a booking confirmation email
 */
const sendBookingEmail = async (userEmail, userName, eventTitle) => {
    const transport = getTransporter();

    if (!transport) {
        console.log('\n============================================================');
        console.log(`📧 [EMAIL SIMULATION] Booking Confirmed`);
        console.log(`   To: ${userEmail} (${userName})`);
        console.log(`   Event: "${eventTitle}"`);
        console.log(`   (Configure EMAIL_USER and EMAIL_PASS in server/.env to send real emails)`);
        console.log('============================================================\n');
        return { success: true, simulated: true };
    }

    try {
        const mailOptions = {
            from: `"Eventora" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `Booking Confirmed: ${eventTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; rounded: 8px;">
                    <h2 style="color: #111827; margin-bottom: 8px;">Hi ${userName}! 🎉</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                        Your booking for <strong>${eventTitle}</strong> has been officially confirmed by the administrator.
                    </p>
                    <p style="color: #4b5563; font-size: 14px;">
                        You can view and manage your ticket anytime by visiting your Eventora dashboard.
                    </p>
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                        Thank you for choosing Eventora! If you have any questions, feel free to reply to this email.
                    </p>
                </div>
            `
        };
        await transport.sendMail(mailOptions);
        console.log(`✅ Confirmation email delivered to ${userEmail} for event: "${eventTitle}"`);
        return { success: true };
    } catch (error) {
        console.error('⚠️ Error sending booking confirmation email:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Sends a 2FA OTP verification code email
 */
const sendOTPEmail = async (userEmail, otp, type) => {
    const transport = getTransporter();

    const title = type === 'account_verification'
        ? 'Verify your Eventora Account'
        : 'Confirm Event Booking OTP';

    const msg = type === 'account_verification'
        ? 'Please use the following 6-digit verification code to activate your new Eventora account.'
        : 'Please use the following 6-digit code to authorize and confirm your ticket booking.';

    if (!transport) {
        console.log('\n============================================================');
        console.log(`🔐 [EMAIL SIMULATION] 2FA OTP Code`);
        console.log(`   Type:  ${type}`);
        console.log(`   To:    ${userEmail}`);
        console.log(`   OTP:   👉  ${otp}  👈`);
        console.log(`   Expires in 5 minutes.`);
        console.log(`   (Configure EMAIL_USER and EMAIL_PASS in server/.env to send real emails)`);
        console.log('============================================================\n');
        return { success: true, simulated: true, otp };
    }

    try {
        const mailOptions = {
            from: `"Eventora Security" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `${title} - Eventora`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; text-align: center; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
                    <h2 style="color: #111827; margin-bottom: 12px;">${title}</h2>
                    <p style="color: #4b5563; font-size: 15px; margin-bottom: 24px;">${msg}</p>
                    <div style="margin: 20px auto; padding: 16px 28px; font-size: 28px; font-weight: 800; background: #f3f4f6; color: #111827; width: max-content; letter-spacing: 8px; border-radius: 8px; border: 1px dashed #9ca3af;">
                        ${otp}
                    </div>
                    <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">This code expires in <strong>5 minutes</strong>. Do not share this code with anyone.</p>
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                    <p style="color: #9ca3af; font-size: 11px;">If you didn't request this action, you can safely ignore this email.</p>
                </div>
            `
        };
        await transport.sendMail(mailOptions);
        console.log(`✅ OTP email delivered to ${userEmail} for ${type}`);
        return { success: true };
    } catch (error) {
        console.error('⚠️ Error sending OTP email:', error.message);
        // Fallback log so developer/user is not locked out
        console.log('\n============================================================');
        console.log(`🔐 [FALLBACK OTP LOG] Due to SMTP error (${error.message})`);
        console.log(`   To:  ${userEmail}`);
        console.log(`   OTP: 👉  ${otp}  👈`);
        console.log('============================================================\n');
        return { success: false, error: error.message, simulated: true, otp };
    }
};

module.exports = { sendBookingEmail, sendOTPEmail, isEmailConfigured };
