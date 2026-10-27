import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const userInfo = localStorage.getItem('userInfo');
            const token = localStorage.getItem('token');
            if (userInfo && token) {
                setUser(JSON.parse(userInfo));
            }
        } catch (e) {
            console.error('Failed to parse user session from localStorage:', e);
            localStorage.removeItem('userInfo');
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            return data;
        } catch (error) {
            if (error.response?.data?.needsVerification) {
                throw error.response.data;
            }
            throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
        }
    };

    const register = async (name, email, password) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            return data; // Returns { message, email, devOtp, emailConfigured }
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    const verifyOTP = async (email, otp) => {
        try {
            const { data } = await api.post('/auth/verify-otp', { email, otp });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            return data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'OTP verification failed. Please try again.');
        }
    };

    const resendOTP = async (email, action = 'account_verification') => {
        try {
            const { data } = await api.post('/auth/resend-otp', { email, action });
            return data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to resend OTP. Please try again.');
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, verifyOTP, resendOTP, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
