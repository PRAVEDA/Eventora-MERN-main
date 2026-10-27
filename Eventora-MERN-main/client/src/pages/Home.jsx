import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaRegClock, FaTicketAlt, FaShieldAlt } from 'react-icons/fa';

const CATEGORIES = ['All', 'Technology', 'Music', 'Business', 'Art'];

const Home = () => {
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchEvents();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search, selectedCategory]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search.trim()) params.append('search', search.trim());
            if (selectedCategory !== 'All') params.append('category', selectedCategory);

            const { data } = await api.get(`/events?${params.toString()}`);
            setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <div className="relative bg-black text-white rounded-3xl overflow-hidden mb-12 shadow-2xl">
                <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
                <div className="relative p-8 sm:p-14 md:p-20 text-center flex flex-col items-center z-10">
                    <span className="bg-white/20 text-white backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-white/20">
                        Welcome to Eventora
                    </span>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight drop-shadow-lg">
                        Find Your Next <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">
                            Unforgettable
                        </span>{' '}
                        Experience
                    </h1>
                    <p className="text-gray-300 text-base sm:text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                        Discover top tech summits, lively music festivals, and hands-on masterclasses. Secure your attendance with seamless 2FA booking.
                    </p>

                    <div className="w-full max-w-2xl mx-auto relative flex items-center shadow-2xl group">
                        <FaSearch className="absolute left-6 text-gray-400 text-lg group-focus-within:text-black transition-colors" />
                        <input
                            type="text"
                            placeholder="Search events by title or keyword..."
                            className="w-full pl-14 pr-6 py-4 sm:py-5 rounded-full text-base sm:text-lg text-black bg-white/95 backdrop-blur-sm border-2 border-transparent focus:border-gray-900 focus:outline-none transition-all placeholder-gray-400 font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Features Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition duration-300">
                    <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-xl mb-5 shadow-sm">
                        <FaRegClock />
                    </div>
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">Fast Booking</h3>
                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                        Secure event seats in seconds with our streamlined ticket reservation system.
                    </p>
                </div>
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition duration-300">
                    <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-xl mb-5 shadow-sm">
                        <FaTicketAlt />
                    </div>
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">Digital Tickets</h3>
                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                        Manage all confirmed passes, dates, and amounts directly from your personal dashboard.
                    </p>
                </div>
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition duration-300">
                    <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-xl mb-5 shadow-sm">
                        <FaShieldAlt />
                    </div>
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">2FA OTP Security</h3>
                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                        Every ticket order and account activation is verified with email one-time authentication.
                    </p>
                </div>
            </div>

            {/* Category Filter Pills & Results Count */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-gray-200">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Upcoming Events</h2>
                    <p className="text-xs text-gray-500 mt-1">{events.length} events available</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                                selectedCategory === cat
                                    ? 'bg-gray-900 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Events Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Discovering events...</p>
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <p className="text-lg font-bold text-gray-700 mb-2">No events found matching your criteria.</p>
                    <p className="text-sm text-gray-500 mb-4">Try clearing filters or searching for something else.</p>
                    <button
                        onClick={() => { setSearch(''); setSelectedCategory('All'); }}
                        className="text-xs bg-gray-900 text-white font-bold px-4 py-2 rounded-lg hover:bg-black transition"
                    >
                        Reset Search Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.map((event) => (
                        <div
                            key={event._id}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-gray-100 group"
                        >
                            <div className="h-52 bg-gray-900 overflow-hidden relative">
                                {event.image ? (
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400 font-black text-2xl uppercase tracking-wider">
                                        {event.category || 'Event'}
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black shadow-md">
                                    {event.ticketPrice === 0 ? (
                                        <span className="text-green-600">FREE</span>
                                    ) : (
                                        <span className="text-gray-900">₹{event.ticketPrice}</span>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 flex-grow flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                                    {event.category}
                                </span>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug line-clamp-2">
                                    {event.title}
                                </h3>

                                <div className="flex flex-col gap-2 mb-6 text-gray-500 text-xs">
                                    <div className="flex items-center gap-2">
                                        <FaCalendarAlt className="text-gray-400 shrink-0" />
                                        <span>
                                            {new Date(event.date).toLocaleDateString(undefined, {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-gray-400 shrink-0" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                                        <span>Capacity</span>
                                        <span className={event.availableSeats > 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                                            {event.availableSeats > 0 ? `${event.availableSeats} of ${event.totalSeats} seats` : 'Sold Out'}
                                        </span>
                                    </div>

                                    <Link
                                        to={`/events/${event._id}`}
                                        className="block w-full text-center bg-gray-900 hover:bg-black text-white font-bold py-2.5 rounded-xl transition text-sm shadow-sm"
                                    >
                                        View Details & Book
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            <footer className="mt-auto pt-16 pb-8 border-t border-gray-200 text-center">
                <div className="flex justify-center items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center text-xs">
                        <FaTicketAlt />
                    </div>
                    <span className="text-lg font-black text-gray-900">Eventora</span>
                </div>
                <p className="text-gray-500 text-xs mb-4 max-w-sm mx-auto">
                    Full-stack MERN event booking platform with 2FA email authentication and administrative management.
                </p>
                <div className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">
                    &copy; {new Date().getFullYear()} Eventora Platform. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default Home;
