const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const { sendBookingEmail, sendOTPEmail, isEmailConfigured } = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendBookingOTP = async (req, res) => {
    try {
        const otp = generateOTP();
        await OTP.deleteMany({ email: req.user.email, action: 'event_booking' });
        await OTP.create({ email: req.user.email, otp, action: 'event_booking' });
        await sendOTPEmail(req.user.email, otp, 'event_booking');

        const responsePayload = {
            message: 'Booking authorization OTP sent to your registered email.',
            emailConfigured: isEmailConfigured()
        };

        return res.json(responsePayload);
    } catch (error) {
        console.error('sendBookingOTP error:', error);
        return res.status(500).json({ message: 'Error sending booking OTP', error: error.message });
    }
};

exports.bookEvent = async (req, res) => {
    try {
        const { eventId, otp } = req.body;

        if (!eventId || !otp) {
            return res.status(400).json({ message: 'Event ID and 6-digit OTP code are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        // Verify OTP explicitly
        const validOTP = await OTP.findOne({
            email: req.user.email,
            otp: String(otp).trim(),
            action: 'event_booking'
        });

        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP code for booking.' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        if (event.availableSeats <= 0) {
            return res.status(400).json({ message: 'Sorry, this event is completely sold out.' });
        }

        const existingBooking = await Booking.findOne({ userId: req.user.id, eventId });
        if (existingBooking && existingBooking.status !== 'cancelled') {
            return res.status(400).json({
                message: existingBooking.status === 'confirmed'
                    ? 'You already have a confirmed ticket for this event.'
                    : 'You already have a pending booking request for this event.'
            });
        }

        const booking = await Booking.create({
            userId: req.user.id,
            eventId,
            status: 'pending',
            paymentStatus: event.ticketPrice === 0 ? 'paid' : 'not_paid',
            amount: event.ticketPrice
        });

        // Clean up OTP after successful booking submission
        await OTP.deleteOne({ _id: validOTP._id });

        return res.status(201).json({
            message: 'Booking request submitted successfully! Awaiting organizer review.',
            booking
        });
    } catch (error) {
        console.error('bookEvent error:', error);
        return res.status(500).json({ message: 'Server error during booking', error: error.message });
    }
};

exports.confirmBooking = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid booking ID' });
        }

        const { paymentStatus } = req.body; // 'paid' or 'not_paid'
        const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.status === 'confirmed') {
            return res.status(400).json({ message: 'This booking is already confirmed' });
        }

        if (!booking.eventId) {
            return res.status(400).json({ message: 'Cannot confirm booking: Event has been deleted' });
        }

        // Concurrency-safe atomic seat deduction:
        const event = await Event.findOneAndUpdate(
            { _id: booking.eventId._id, availableSeats: { $gt: 0 } },
            { $inc: { availableSeats: -1 } },
            { new: true }
        );

        if (!event) {
            return res.status(400).json({ message: 'No seats available to confirm this booking' });
        }

        booking.status = 'confirmed';
        if (paymentStatus) {
            booking.paymentStatus = paymentStatus;
        }
        await booking.save();

        // Send confirmation email
        if (booking.userId && booking.userId.email) {
            await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId.title);
        }

        return res.json({
            message: 'Booking confirmed successfully',
            booking,
            remainingSeats: event.availableSeats
        });
    } catch (error) {
        console.error('confirmBooking error:', error);
        return res.status(500).json({ message: 'Server error confirming booking', error: error.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = req.user.role === 'admin'
            ? await Booking.find()
                .populate('eventId')
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
            : await Booking.find({ userId: req.user.id })
                .populate('eventId')
                .sort({ createdAt: -1 });

        return res.json(bookings);
    } catch (error) {
        console.error('getMyBookings error:', error);
        return res.status(500).json({ message: 'Server error retrieving bookings', error: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid booking ID' });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to cancel this booking' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Booking is already cancelled' });
        }

        const wasConfirmed = booking.status === 'confirmed';
        booking.status = 'cancelled';
        await booking.save();

        // Restore seat if it was previously confirmed and deducted
        if (wasConfirmed && booking.eventId) {
            await Event.findByIdAndUpdate(booking.eventId, { $inc: { availableSeats: 1 } });
        }

        return res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('cancelBooking error:', error);
        return res.status(500).json({ message: 'Server error cancelling booking', error: error.message });
    }
};
