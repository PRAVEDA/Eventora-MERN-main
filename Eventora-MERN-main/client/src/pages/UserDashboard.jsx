import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { Link } from 'react-router-dom';
import { FaTicketAlt, FaTimesCircle, FaCalendarAlt, FaMapMarkerAlt, FaFilter } from 'react-icons/fa';

const UserDashboard = () => {
    const { user } = useContext(AuthContext);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [actionMsg, setActionMsg] = useState('');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const { data } = await api.get('/bookings/my');
            setBookings(data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this booking request?')) {
            return;
        }

        try {
            await api.delete(`/bookings/${id}`);
            setActionMsg('Booking cancelled successfully.');
            setTimeout(() => setActionMsg(''), 4000);
            fetchBookings();
        } catch (error) {
            alert(error.response?.data?.message || 'Error cancelling booking');
        }
    };

    const filteredBookings = bookings.filter((b) => {
        if (filter === 'confirmed') return b.status === 'confirmed';
        if (filter === 'pending') return b.status === 'pending';
        if (filter === 'cancelled') return b.status === 'cancelled';
        return true;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Loading your bookings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* User Profile Banner */}
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
                <div className="w-20 h-20 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-3xl font-black uppercase tracking-wider shrink-0 shadow-md">
                    {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                            Hello, {user?.name}!
                        </h1>
                        <span className="bg-green-100 text-green-800 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
                            Active Member
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">{user?.email}</p>
                </div>
            </div>

            {actionMsg && (
                <div className="bg-green-50 text-green-700 text-sm p-4 rounded-xl border border-green-200">
                    {actionMsg}
                </div>
            )}

            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <FaTicketAlt className="text-gray-700" /> My Event Tickets
                </h2>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 text-xs font-bold shadow-sm">
                    {['all', 'confirmed', 'pending', 'cancelled'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-3 py-1.5 rounded-lg capitalize transition ${
                                filter === tab
                                    ? 'bg-gray-900 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        <FaTicketAlt />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No bookings found</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                        {filter === 'all'
                            ? "You haven't reserved any tickets yet. Explore upcoming conferences, festivals, and workshops."
                            : `You have no ${filter} bookings at this time.`}
                    </p>
                    <Link
                        to="/"
                        className="inline-block bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl transition shadow-md text-sm"
                    >
                        Browse All Events
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBookings.map((booking) => (
                        <div
                            key={booking._id}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col"
                        >
                            <div className="p-6 flex-grow">
                                <div className="flex justify-between items-start mb-4 gap-2">
                                    <h3 className="text-lg font-extrabold text-gray-900 leading-snug">
                                        {booking.eventId?.title || 'Deleted Event'}
                                    </h3>
                                    <span
                                        className={`px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider shrink-0 ${
                                            booking.status === 'confirmed'
                                                ? 'bg-green-100 text-green-700'
                                                : booking.status === 'cancelled'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}
                                    >
                                        {booking.status}
                                    </span>
                                </div>

                                {booking.eventId ? (
                                    <div className="text-xs text-gray-600 space-y-2 mb-4">
                                        <p className="flex items-center gap-2">
                                            <FaCalendarAlt className="text-gray-400" />
                                            <span>
                                                {new Date(booking.eventId.date).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <FaMapMarkerAlt className="text-gray-400" />
                                            <span className="truncate">{booking.eventId.location}</span>
                                        </p>
                                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                                            <span className="text-gray-400 font-semibold uppercase text-[10px]">Price</span>
                                            <span className="font-bold text-gray-900">
                                                {booking.amount === 0 ? <span className="text-green-600">Free</span> : `₹${booking.amount}`}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-red-500 italic mb-4">
                                        Event is no longer available.
                                    </p>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs">
                                {booking.eventId ? (
                                    <Link
                                        to={`/events/${booking.eventId._id}`}
                                        className="font-bold text-gray-900 hover:underline"
                                    >
                                        View Details
                                    </Link>
                                ) : (
                                    <span className="text-gray-400">Unavailable</span>
                                )}

                                {booking.status !== 'cancelled' && (
                                    <button
                                        onClick={() => handleCancel(booking._id)}
                                        className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 transition"
                                    >
                                        <FaTimesCircle /> Cancel Request
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
