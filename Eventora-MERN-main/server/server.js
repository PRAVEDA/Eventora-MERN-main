const dns = require('dns');
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

// DNS resolution configuration (Windows SRV record fix for MongoDB Atlas)
if (process.env.DNS_SERVERS) {
    try {
        dns.setServers(process.env.DNS_SERVERS.split(','));
    } catch (e) {
        console.warn('Could not set custom DNS servers:', e.message);
    }
} else if (process.platform === 'win32') {
    try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (e) {
        // Fall back to system DNS
    }
}

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Security Headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' } // Allows external images (e.g. Unsplash)
}));

// Request Logging
if (isProduction) {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// CORS Configuration
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map(origin => origin.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g., mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || !isProduction) {
            return callback(null, true);
        }
        return callback(new Error('CORS not allowed for this origin'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers with payload size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', globalLimiter);

// Stricter Rate Limiter for Auth & OTP endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});
app.use('/api/auth', authLimiter);
app.use('/api/bookings/send-otp', authLimiter);

// Database Connection Manager (Cached for Serverless & Long-running runtimes)
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventora';

let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGO_URI).then((m) => {
            console.log('✅ MongoDB Connected Successfully');
            return m;
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }
    return cached.conn;
}

// Middleware to ensure DB connection before processing API routes (Crucial for Vercel Serverless)
app.use(async (req, res, next) => {
    try {
        await connectDB();
    } catch (err) {
        console.error('Database connection error in request handler:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Database connection failed. Please ensure MongoDB Atlas credentials are valid and IP access is open.'
        });
    }
    next();
});

// Health Check Endpoint
app.get(['/api/health', '/health'], (req, res) => {
    res.json({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// API Routes (mounted under both /api and root prefixes for compatibility with all rewrite styles)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/events', '/events'], eventRoutes);
app.use(['/api/bookings', '/bookings'], bookingRoutes);

// Serve static client assets in production if client build exists
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req, res, next) => {
        if (req.originalUrl.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
}

// 404 Route Handler for undefined endpoints
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint not found: ${req.method} ${req.originalUrl}`
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint not found: ${req.method} ${req.originalUrl}`
    });
});

// Centralized Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        ...(isProduction ? {} : { stack: err.stack })
    });
});

// Server Startup (Local / Container)
if (require.main === module) {
    connectDB()
        .then(() => {
            const server = app.listen(PORT, () => {
                console.log(`🚀 Eventora Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
                console.log(`🌐 Health check available at: http://localhost:${PORT}/api/health`);
            });

            // Graceful Shutdown
            const shutdown = () => {
                console.log('\nGracefully shutting down Eventora Server...');
                server.close(() => {
                    console.log('HTTP server closed.');
                    mongoose.connection.close(false, () => {
                        console.log('MongoDB connection closed.');
                        process.exit(0);
                    });
                });
            };

            process.on('SIGTERM', shutdown);
            process.on('SIGINT', shutdown);
        })
        .catch(err => {
            console.error('❌ MongoDB Connection Error:', err.message);
            process.exit(1);
        });
}

module.exports = app;
