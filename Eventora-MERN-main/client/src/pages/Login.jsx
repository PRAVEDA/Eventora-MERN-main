import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const { login, verifyOTP, resendOTP } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('session_expired')) {
            setNotice('Your session has expired. Please sign in again.');
        }
    }, [location]);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setNotice('');

        try {
            if (!showOTP) {
                const data = await login(email, password);
                if (data.role === 'admin') navigate('/admin');
                else navigate('/dashboard');
            } else {
                const data = await verifyOTP(email, otp);
                if (data.role === 'admin') navigate('/admin');
                else navigate('/dashboard');
            }
        } catch (err) {
            if (err.needsVerification) {
                setShowOTP(true);
                setNotice('Account not yet verified. A 6-digit OTP has been sent to your email.');
                setResendCooldown(30);
            } else {
                setError(err.message || String(err));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        try {
            setLoading(true);
            setError('');
            await resendOTP(email, 'account_verification');
            setNotice('A fresh 6-digit OTP code has been sent to your email.');
            setResendCooldown(30);
        } catch (err) {
            setError(err.message || 'Failed to resend OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-500 text-sm">Sign in to your Eventora account</p>
            </div>

            {notice && (
                <div className="bg-blue-50 text-blue-700 text-sm p-4 rounded-xl mb-6 border border-blue-200">
                    {notice}
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-6 border border-red-200">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {!showOTP ? (
                    <>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                placeholder="name@example.com"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition outline-none"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition outline-none"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </>
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-700">Verification Code (OTP)</label>
                            <button
                                type="button"
                                onClick={() => { setShowOTP(false); setError(''); }}
                                className="text-xs text-gray-500 hover:underline"
                            >
                                Change email
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                            Check your inbox for the 6-digit verification code sent to <strong>{email}</strong>
                        </p>
                        <input
                            type="text"
                            required
                            placeholder="6-digit code"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 transition outline-none font-bold tracking-widest text-center text-2xl"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            autoFocus
                        />
                        <div className="flex justify-between items-center mt-3 text-xs">
                            <span className="text-gray-500">Didn't receive the email?</span>
                            <button
                                type="button"
                                disabled={resendCooldown > 0 || loading}
                                onClick={handleResend}
                                className={`font-bold ${resendCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900 hover:underline'}`}
                            >
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                            </button>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || (showOTP && otp.length !== 6)}
                    className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Please wait...' : (showOTP ? 'Verify OTP & Continue' : 'Sign In')}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-gray-900 font-bold hover:underline">
                    Create an account
                </Link>
            </div>
        </div>
    );
};

export default Login;
