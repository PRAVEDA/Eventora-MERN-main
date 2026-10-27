import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaCalendarCheck, FaArrowRight } from 'react-icons/fa';

const PaymentSuccess = () => {
    const location = useLocation();
    const { eventTitle, ticketPrice, bookingId } = location.state || {};

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full text-center border border-gray-100">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaCheckCircle className="text-green-500 text-5xl" />
                </div>

                <span className="inline-block bg-green-100 text-green-800 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                    Request Received
                </span>

                <h1 className="text-3xl font-black text-gray-900 mb-3">
                    Booking Submitted!
                </h1>

                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    Your ticket booking request has been successfully registered. The event administrator will review and confirm your seat shortly.
                </p>

                {eventTitle && (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 text-left text-sm space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase">Event</span>
                            <span className="font-bold text-gray-900 text-right">{eventTitle}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase">Ticket Price</span>
                            <span className="font-bold text-gray-900">
                                {ticketPrice === 0 ? 'Free' : `₹${ticketPrice}`}
                            </span>
                        </div>
                        {bookingId && (
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                <span className="text-xs font-bold text-gray-500 uppercase">Booking ID</span>
                                <span className="font-mono text-xs text-gray-600">{bookingId}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-3">
                    <Link
                        to="/dashboard"
                        className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-bold py-3.5 px-6 rounded-xl transition shadow-md"
                    >
                        <FaCalendarCheck /> View My Bookings
                    </Link>
                    <Link
                        to="/"
                        className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-xl transition text-sm"
                    >
                        Browse Other Events <FaArrowRight className="text-xs" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
