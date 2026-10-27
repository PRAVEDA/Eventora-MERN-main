import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaTicketAlt, FaBars, FaTimes, FaUserShield, FaUser } from 'react-icons/fa';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setMobileOpen(false);
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bg-gray-900 text-white shadow-xl sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Brand */}
                    <Link
                        to="/"
                        className="text-white text-2xl font-black flex items-center gap-2 tracking-tight hover:opacity-90 transition"
                        onClick={() => setMobileOpen(false)}
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center text-white shadow-sm">
                            <FaTicketAlt className="text-lg" />
                        </div>
                        <span>Eventora</span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            to="/"
                            className={`text-sm font-semibold transition ${isActive('/') ? 'text-white border-b-2 border-white pb-1' : 'text-gray-300 hover:text-white'}`}
                        >
                            Browse Events
                        </Link>

                        {user ? (
                            <>
                                <Link
                                    to={user.role === 'admin' ? '/admin' : '/dashboard'}
                                    className={`text-sm font-semibold flex items-center gap-1.5 transition ${isActive('/admin') || isActive('/dashboard') ? 'text-white border-b-2 border-white pb-1' : 'text-gray-300 hover:text-white'}`}
                                >
                                    {user.role === 'admin' ? (
                                        <>
                                            <FaUserShield className="text-yellow-400" />
                                            <span>Admin Panel</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaUser className="text-gray-400" />
                                            <span>My Bookings</span>
                                        </>
                                    )}
                                </Link>

                                <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
                                    <div className="flex flex-col text-right">
                                        <span className="text-xs font-bold text-gray-200">{user.name}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${user.role === 'admin' ? 'text-yellow-400' : 'text-gray-400'}`}>
                                            {user.role}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold px-3.5 py-2 rounded-lg transition border border-gray-700 shadow-sm"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/login"
                                    className="text-gray-200 hover:text-white text-sm font-semibold px-3 py-2 transition"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-white text-gray-900 hover:bg-gray-100 text-sm font-bold px-4 py-2 rounded-lg transition shadow-md"
                                >
                                    Create Account
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Hamburger Button */}
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="text-gray-300 hover:text-white text-xl p-2 focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <FaTimes /> : <FaBars />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileOpen && (
                <div className="md:hidden bg-gray-950 border-t border-gray-800 px-4 pt-3 pb-6 space-y-3">
                    <Link
                        to="/"
                        onClick={() => setMobileOpen(false)}
                        className="block text-gray-200 hover:text-white font-medium py-2"
                    >
                        Browse Events
                    </Link>

                    {user ? (
                        <>
                            <Link
                                to={user.role === 'admin' ? '/admin' : '/dashboard'}
                                onClick={() => setMobileOpen(false)}
                                className="block text-gray-200 hover:text-white font-medium py-2"
                            >
                                {user.role === 'admin' ? 'Admin Panel' : 'My Bookings'}
                            </Link>
                            <div className="pt-2 border-t border-gray-800 flex justify-between items-center">
                                <span className="text-xs text-gray-400">{user.email} ({user.role})</span>
                                <button
                                    onClick={handleLogout}
                                    className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded transition"
                                >
                                    Log Out
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="pt-3 border-t border-gray-800 flex flex-col gap-2">
                            <Link
                                to="/login"
                                onClick={() => setMobileOpen(false)}
                                className="block text-center py-2.5 text-sm font-semibold text-gray-200 bg-gray-800 rounded-lg"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                onClick={() => setMobileOpen(false)}
                                className="block text-center py-2.5 text-sm font-bold text-gray-900 bg-white rounded-lg"
                            >
                                Create Account
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
