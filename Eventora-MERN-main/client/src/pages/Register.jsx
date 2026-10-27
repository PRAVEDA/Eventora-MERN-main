import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const { register, verifyOTP, resendOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setNotice('');

        if (!showOTP) {
            if (password.length < 6) {
                setError('Password must be at least 6 characters long.');
                return;
            }
        }

        setLoading(true);

        try {
            if (!showOTP) {
                await register(name, email, password);
                setShowOTP(true);
                setNotice('Account created! A 6-digit OTP code has been sent to your email.');
                setResendCooldown(30);
            } else {
                await verifyOTP(email, otp);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || String(err));
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
                <h2 className="text-3xl font-black text-gray-900 mb-2">Create an Account</h2>
                <p className="text-gray-500 text-sm">Join the Eventora community today</p>
            </div>

            {notice && (
                <div className="bg-green-50 text-green-700 text-sm p-4 rounded-xl mb-6 border border-green-200">
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
                            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                required
                                placeholder="John Doe"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition outline-none"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
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
                                placeholder="At least 6 characters"
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
                                Edit info
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
                            <span className="text-gray-500">Didn't receive code?</span>
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
                    {loading ? 'Please wait...' : (showOTP ? 'Verify & Activate Account' : 'Sign Up')}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-gray-900 font-bold hover:underline">
                    Sign in
                </Link>
            </div>
        </div>
    );
};

export default Register;
