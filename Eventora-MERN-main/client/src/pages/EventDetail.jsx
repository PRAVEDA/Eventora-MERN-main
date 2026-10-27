import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaChair, FaMoneyBillWave, FaArrowLeft, FaCheck } from 'react-icons/fa';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const { data } = await api.get(`/events/${id}`);
                setEvent(data);
            } catch (err) {
                setError('Failed to load event details or event does not exist.');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleSendOTP = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setBookingLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            await api.post('/bookings/send-otp');
            setShowOTP(true);
            setSuccessMsg('Authorization OTP sent to your registered email.');
            setResendCooldown(30);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send booking OTP.');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit verification code.');
            return;
        }

        setBookingLoading(true);
        setError('');

        try {
            const { data } = await api.post('/bookings', { eventId: event._id, otp });
            // Redirect to success page with booking details
            navigate('/payment-success', {
                state: {
                    eventTitle: event.title,
                    ticketPrice: event.ticketPrice,
                    location: event.location,
                    bookingId: data.booking?._id
                }
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Booking request failed. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Loading event details...</p>
            </div>
        );
    }

    if (error && !event) {
        return (
            <div className="max-w-xl mx-auto text-center py-20 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <p className="text-xl font-bold text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 bg-gray-900 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-black transition"
                >
                    <FaArrowLeft /> Back to Events
                </button>
            </div>
        );
    }

    const isSoldOut = event.availableSeats <= 0;

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden mt-4 border border-gray-100">
            {/* Header Image or Fallback */}
            <div className="relative h-80 bg-gray-900 overflow-hidden">
                {event.image ? (
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-gray-900 to-gray-800 text-gray-500 text-4xl font-black uppercase tracking-wider">
                        {event.category}
                    </div>
                )}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 bg-black/60 hover:bg-black text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md transition flex items-center gap-2"
                >
                    <FaArrowLeft /> Back
                </button>
                <div className="absolute top-6 right-6 bg-white/95 text-gray-900 font-extrabold px-4 py-1.5 rounded-full text-sm shadow-md">
                    {event.ticketPrice === 0 ? <span className="text-green-600 font-black">FREE</span> : `₹${event.ticketPrice}`}
                </div>
            </div>

            <div className="p-8 md:p-12">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
                    {/* Left: Info */}
                    <div className="flex-1">
                        <span className="inline-block bg-gray-100 text-gray-800 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-4 border border-gray-200">
                            {event.category}
                        </span>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">
                            {event.title}
                        </h1>

                        <div className="space-y-4 mb-8 text-gray-600 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800 shrink-0">
                                    <FaCalendarAlt />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Date & Time</p>
                                    <p className="font-semibold text-gray-800">
                                        {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800 shrink-0">
                                    <FaMapMarkerAlt />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Venue</p>
                                    <p className="font-semibold text-gray-800">{event.location}</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">About This Event</h3>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-base">
                                {event.description}
                            </p>
                        </div>
                    </div>

                    {/* Right: Booking Box */}
                    <div className="w-full lg:w-80 bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-200 shrink-0 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                            Ticket Information
                        </h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <FaMoneyBillWave className="text-gray-400" /> Price per ticket
                                </span>
                                <span className="font-black text-gray-900 text-lg">
                                    {event.ticketPrice === 0 ? <span className="text-green-600">Free</span> : `₹${event.ticketPrice}`}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <FaChair className="text-gray-400" /> Remaining seats
                                </span>
                                <span className={`font-black ${event.availableSeats > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {event.availableSeats} of {event.totalSeats}
                                </span>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4 border border-red-200">
                                {error}
                            </div>
                        )}

                        {successMsg && !showOTP && (
                            <div className="bg-green-50 text-green-700 text-xs p-3 rounded-lg mb-4 border border-green-200">
                                {successMsg}
                            </div>
                        )}

                        {!showOTP ? (
                            <button
                                onClick={handleSendOTP}
                                disabled={isSoldOut || bookingLoading}
                                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition shadow-md ${
                                    isSoldOut
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-900 hover:bg-black text-white hover:shadow-lg'
                                }`}
                            >
                                {bookingLoading ? 'Sending verification code...' : isSoldOut ? 'Sold Out' : 'Book Ticket (2FA OTP)'}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Enter 6-digit OTP sent to email
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 font-bold tracking-widest text-center text-xl outline-none"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                        autoFocus
                                    />
                                    <div className="flex justify-between items-center mt-2 text-xs">
                                        <button
                                            type="button"
                                            disabled={resendCooldown > 0 || bookingLoading}
                                            onClick={handleSendOTP}
                                            className={`font-semibold ${resendCooldown > 0 ? 'text-gray-400' : 'text-gray-800 hover:underline'}`}
                                        >
                                            {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend code'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowOTP(false); setError(''); }}
                                            className="text-gray-500 hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={bookingLoading || otp.length !== 6}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {bookingLoading ? 'Submitting request...' : 'Verify & Submit Booking'}
                                </button>
                            </div>
                        )}

                        <p className="text-[11px] text-gray-400 text-center mt-4">
                            All bookings require 2FA OTP verification and organizer approval.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
