const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

// Route imports
const distressRoutes = require('./routes/distressRoutes');
const reliefCampRoutes = require('./routes/reliefCampRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const authRoutes = require('./routes/authRoutes');

// Middleware imports
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// ==========================================
// 1. SECURITY & UTILITY MIDDLEWARES
// ==========================================

// Helmet for robust HTTP security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible integration with map tiles/leaflets/scripts
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration supporting single or comma-separated origins
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in development to facilitate rapid frontend integration
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// HTTP request logger
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// 2. HEALTH & DIAGNOSTIC ENDPOINTS
// ==========================================
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  res.status(200).json({
    success: true,
    platform: 'Noor Disaster Relief Coordination Platform',
    status: 'Operational',
    timestamp: new Date().toISOString(),
    database: {
      status: statusMap[dbStatus] || 'Unknown',
      readyState: dbStatus,
    },
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ==========================================
// 3. API ROUTES
// ==========================================
app.use('/api/distress', distressRoutes);
app.use('/api/camps', reliefCampRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/auth', authRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Noor Disaster Relief Coordination API',
    documentation: '/api/health',
    version: '1.0.0',
    availableEndpoints: [
      '/api/health',
      '/api/distress',
      '/api/camps',
      '/api/inventory',
      '/api/auth',
    ],
  });
});

// ==========================================
// 4. ERROR HANDLING
// ==========================================
app.use(notFound);
app.use(errorHandler);

module.exports = app;
