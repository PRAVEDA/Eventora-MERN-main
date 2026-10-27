import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { FaPlus, FaTimes, FaEdit, FaTrash, FaCheck, FaBan, FaCalendarAlt, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingFilter, setBookingFilter] = useState('all');
    const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

    // Create / Edit Event Form State
    const [showEventForm, setShowEventForm] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        category: '',
        totalSeats: '',
        ticketPrice: '',
        image: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const showNotification = (text, type = 'success') => {
        setStatusMsg({ text, type });
        setTimeout(() => setStatusMsg({ text: '', type: '' }), 5000);
    };

    const fetchData = async () => {
        try {
            const [eventsRes, bookingsRes] = await Promise.all([
                api.get('/events'),
                api.get('/bookings/my')
            ]);
            setEvents(eventsRes.data);
            setBookings(bookingsRes.data);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            showNotification('Failed to fetch dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateForm = () => {
        setEditingEventId(null);
        setFormData({
            title: '',
            description: '',
            date: '',
            location: '',
            category: '',
            totalSeats: '',
            ticketPrice: '0',
            image: ''
        });
        setShowEventForm(true);
    };

    const handleOpenEditForm = (ev) => {
        setEditingEventId(ev._id);
        const formattedDate = ev.date ? new Date(ev.date).toISOString().split('T')[0] : '';
        setFormData({
            title: ev.title || '',
            description: ev.description || '',
            date: formattedDate,
            location: ev.location || '',
            category: ev.category || '',
            totalSeats: String(ev.totalSeats || ''),
            ticketPrice: String(ev.ticketPrice || 0),
            image: ev.image || ''
        });
        setShowEventForm(true);
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                date: formData.date,
                location: formData.location.trim(),
                category: formData.category.trim(),
                totalSeats: Number(formData.totalSeats),
                ticketPrice: Number(formData.ticketPrice || 0),
                image: formData.image ? formData.image.trim() : ''
            };

            if (editingEventId) {
                await api.put(`/events/${editingEventId}`, payload);
                showNotification(`Event "${payload.title}" updated successfully!`);
            } else {
                await api.post('/events', payload);
                showNotification(`New event "${payload.title}" published!`);
            }

            setShowEventForm(false);
            setEditingEventId(null);
            fetchData();
        } catch (error) {
            showNotification(error.response?.data?.message || 'Error saving event', 'error');
        }
    };

    const handleDeleteEvent = async (id, title) => {
        if (!window.confirm(`Are you sure you want to delete the event "${title}"?`)) {
            return;
        }

        try {
            await api.delete(`/events/${id}`);
            showNotification(`Event "${title}" deleted.`);
            fetchData();
        } catch (error) {
            showNotification('Error deleting event', 'error');
        }
    };

    const handleConfirmBooking = async (id, paymentStatus) => {
        try {
            await api.put(`/bookings/${id}/confirm`, { paymentStatus });
            showNotification(`Booking confirmed (marked as ${paymentStatus.replace('_', ' ')}).`);
            fetchData();
        } catch (error) {
            showNotification(error.response?.data?.message || 'Error confirming booking', 'error');
        }
    };

    const handleCancelBooking = async (id) => {
        if (!window.confirm("Cancel this user's booking request?")) {
            return;
        }

        try {
            await api.delete(`/bookings/${id}`);
            showNotification('Booking request cancelled/rejected.');
            fetchData();
        } catch (error) {
            showNotification(error.response?.data?.message || 'Error cancelling booking', 'error');
        }
    };

    const filteredBookings = bookings.filter((b) => {
        if (bookingFilter === 'pending') return b.status === 'pending';
        if (bookingFilter === 'confirmed') return b.status === 'confirmed';
        if (bookingFilter === 'cancelled') return b.status === 'cancelled';
        return true;
    });

    const totalRevenue = bookings.reduce(
        (sum, b) => (b.paymentStatus === 'paid' && b.status === 'confirmed' ? sum + (b.amount || 0) : sum),
        0
    );

    const paidClientIds = new Set(
        bookings
            .filter((b) => b.paymentStatus === 'paid' && b.status === 'confirmed' && b.userId?._id)
            .map((b) => b.userId._id)
    );

    const pendingCount = bookings.filter((b) => b.status === 'pending').length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Loading administrative dashboard...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Notification Banner */}
            {statusMsg.text && (
                <div
                    className={`p-4 rounded-xl text-sm font-bold flex justify-between items-center ${
                        statusMsg.type === 'error'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                    }`}
                >
                    <span>{statusMsg.text}</span>
                    <button onClick={() => setStatusMsg({ text: '', type: '' })}>
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* Header Banner */}
            <div className="bg-gray-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <span className="bg-yellow-400 text-gray-950 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block">
                        Administrator Access
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">Admin Overview</h1>
                    <p className="text-gray-400 text-sm">
                        Create events, review 2FA booking requests, and manage attendee tickets.
                    </p>
                </div>

                <button
                    onClick={showEventForm ? () => setShowEventForm(false) : handleOpenCreateForm}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-950 font-black py-3.5 px-6 rounded-xl hover:bg-gray-100 transition shadow-lg text-sm"
                >
                    {showEventForm ? (
                        <>
                            <FaTimes /> Cancel Form
                        </>
                    ) : (
                        <>
                            <FaPlus /> Create New Event
                        </>
                    )}
                </button>
            </div>

            {/* Analytics Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Confirmed Revenue</p>
                        <h3 className="text-3xl font-black text-green-600">₹{totalRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                        ₹
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Paid Attendees</p>
                        <h3 className="text-3xl font-black text-blue-600">{paidClientIds.size}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl">
                        <FaUsers />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Pending Approval</p>
                        <h3 className="text-3xl font-black text-amber-500">{pendingCount}</h3>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                        ⏳
                    </div>
                </div>
            </div>

            {/* Create/Edit Event Form */}
            {showEventForm && (
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                    <h2 className="text-2xl font-black mb-6 text-gray-900">
                        {editingEventId ? 'Edit Event Details' : 'Create New Event'}
                    </h2>
                    <form onSubmit={handleSaveEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Event Title *</label>
                            <input
                                required
                                type="text"
                                placeholder="E.g., Global AI & Cloud Summit 2026"
                                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                            <input
                                required
                                type="text"
                                placeholder="Technology, Music, Business, Art..."
                                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Event Date *</label>
                            <input
                                required
                                type="date"
                                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Location / Venue *</label>
                            <input
                                required
                                type="text"
                                placeholder="City Convention Hall, New York"
                                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Total Capacity (Seats) *</label>
                            <input
                                required
                                type="number"
                                min="1"
                                placeholder="250"
                                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm"
                                value={formData.totalSeats}
                                onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Ticket Price in ₹ (0 for free) *</label>
                            <input
                                required
                                type="number"
                                min="0"
                                placeholder="0"
                                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm"
                                value={formData.ticketPrice}
                                onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Cover Image URL (Direct image link)</label>
                            <input
                                type="url"
                                placeholder="https://images.unsplash.com/photo-..."
                                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Event Description *</label>
                            <textarea
                                required
                                rows={4}
                                placeholder="Provide comprehensive details about the schedule, key speakers, and venue info..."
                                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => { setShowEventForm(false); setEditingEventId(null); }}
                                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl transition shadow-md text-sm"
                            >
                                {editingEventId ? 'Save Changes' : 'Publish Event'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Split View: Events Management & Bookings Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Events Column */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            Published Events
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                                {events.length}
                            </span>
                        </h2>
                    </div>

                    <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1">
                        {events.length === 0 ? (
                            <p className="text-gray-400 text-center py-12 text-sm">No events created yet.</p>
                        ) : (
                            events.map((event) => (
                                <div
                                    key={event._id}
                                    className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-gray-200 text-gray-800 px-2 py-0.5 rounded">
                                                {event.category}
                                            </span>
                                            <span className="text-xs font-bold text-gray-900">
                                                {event.ticketPrice === 0 ? 'Free' : `₹${event.ticketPrice}`}
                                            </span>
                                        </div>
                                        <h4 className="font-extrabold text-gray-900 leading-snug mb-1">{event.title}</h4>
                                        <p className="text-xs text-gray-500 flex items-center gap-2">
                                            <span>{new Date(event.date).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className={event.availableSeats > 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                                                {event.availableSeats}/{event.totalSeats} seats
                                            </span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                                        <button
                                            onClick={() => handleOpenEditForm(event)}
                                            className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                                            title="Edit event"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEvent(event._id, event.title)}
                                            className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                            title="Delete event"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Bookings Queue Column */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            Booking Requests
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                {filteredBookings.length}
                            </span>
                        </h2>

                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-[11px] font-bold">
                            {['all', 'pending', 'confirmed', 'cancelled'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setBookingFilter(tab)}
                                    className={`px-2.5 py-1 rounded-lg capitalize transition ${
                                        bookingFilter === tab
                                            ? 'bg-white text-gray-900 shadow-xs'
                                            : 'text-gray-500 hover:text-gray-900'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1">
                        {filteredBookings.length === 0 ? (
                            <p className="text-gray-400 text-center py-12 text-sm">No bookings in this category.</p>
                        ) : (
                            filteredBookings.map((b) => (
                                <div
                                    key={b._id}
                                    className={`p-5 rounded-2xl border transition ${
                                        b.status === 'pending'
                                            ? 'border-amber-200 bg-amber-50/20'
                                            : b.status === 'confirmed'
                                            ? 'border-green-200 bg-green-50/10'
                                            : 'border-gray-200 bg-gray-50/30'
                                    }`}
                                >
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <div>
                                            <h4 className="font-extrabold text-gray-900 text-sm leading-snug">
                                                {b.eventId?.title || 'Deleted Event'}
                                            </h4>
                                            <p className="text-xs text-gray-500">
                                                {b.userId?.name} ({b.userId?.email})
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span
                                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                                    b.status === 'confirmed'
                                                        ? 'bg-green-100 text-green-700'
                                                        : b.status === 'cancelled'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}
                                            >
                                                {b.status}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400">
                                                ₹{b.amount} • {b.paymentStatus.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {b.status === 'pending' && (
                                        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
                                            <button
                                                onClick={() => handleConfirmBooking(b._id, 'paid')}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition shadow-xs flex items-center justify-center gap-1"
                                            >
                                                <FaCheck className="text-[10px]" /> Approve as Paid
                                            </button>
                                            <button
                                                onClick={() => handleConfirmBooking(b._id, 'not_paid')}
                                                className="flex-1 bg-gray-800 hover:bg-black text-white text-xs font-bold py-2 px-3 rounded-lg transition shadow-xs flex items-center justify-center gap-1"
                                            >
                                                <FaCheck className="text-[10px]" /> Approve Unpaid
                                            </button>
                                            <button
                                                onClick={() => handleCancelBooking(b._id)}
                                                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold py-2 px-3 rounded-lg transition"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
