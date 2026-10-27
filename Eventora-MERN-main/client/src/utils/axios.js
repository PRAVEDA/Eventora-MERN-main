import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 15000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // If the token is invalid or expired, clear session
            const hadToken = localStorage.getItem('token');
            if (hadToken && !window.location.pathname.includes('/login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('userInfo');
                // Redirect user to login with notice
                window.location.href = '/login?session_expired=true';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
