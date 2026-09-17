const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const songRoutes = require('./routes/songRoutes');
const streamRoutes = require('./routes/streamRoutes');

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Cross-Origin Resource Sharing
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to API routes
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'SoundWave Music Platform API',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/stream', streamRoutes);

// Serve static uploads if requested directly
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Centralized error handling
app.use(errorHandler);

module.exports = app;
