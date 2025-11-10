const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const http = require('http');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Import routes
const announcementRoutes = require('./routes/announcementRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const eventRoutes = require('./routes/eventRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Import middleware
const errorHandler = require('./middleware/errorMiddleware');

// Import socket.io initialization
const initializeSocket = require('./utils/socket');

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const { socketMiddleware } = initializeSocket(server);

// Set up rate limiter: more lenient for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute (shorter window)
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Much higher limit for development
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again later',
  skip: (req) => {
    // Skip rate limiting for OPTIONS requests and in development
    return req.method === 'OPTIONS' || process.env.NODE_ENV === 'development';
  }
});

// Middleware
app.use(helmet()); // Set security headers
// Enable CORS for frontend. During development allow any localhost origin so
// the frontend dev server (which may run on different ports) can reach the API.
const allowedOrigins = [process.env.CLIENT_URL, 'https://coordinet.vercel.app'];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    // Allow configured origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any localhost or 127.0.0.1 origin during development
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    // Otherwise block
    return callback(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));
// Parse JSON request body and capture the raw buffer on req.rawBody for
// routes that need the original signed payload (Stripe webhooks).
app.use(express.json({
  verify: (req, res, buf) => {
    // Save raw body buffer for webhook signature verification
    req.rawBody = buf;
  }
}));

// Exclude OPTIONS requests from rate limiting
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  limiter(req, res, next);
});

// Apply socket middleware to routes
app.use(socketMiddleware);

// Import database connection
const { connectDB } = require('./utils/db');

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'coordinet-backend' });
});

// Error handling middleware
app.use(errorHandler);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Export app for testing
module.exports = app;