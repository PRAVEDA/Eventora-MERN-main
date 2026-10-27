import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
                <Navbar />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/events/:id" element={<EventDetail />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <UserDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute adminOnly>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                        <Route path="/payment-failed" element={<PaymentFailed />} />
                        <Route
                            path="*"
                            element={
                                <div className="text-center py-24">
                                    <h1 className="text-6xl font-black text-gray-900 mb-4">404</h1>
                                    <p className="text-xl text-gray-600 mb-8">The page you are looking for does not exist.</p>
                                    <a href="/" className="inline-block bg-gray-900 text-white font-bold py-3 px-8 rounded-lg hover:bg-black transition">
                                        Back to Events
                                    </a>
                                </div>
                            }
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
