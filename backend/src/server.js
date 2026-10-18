require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets/socketHandler');

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Initialize Socket.io with matching CORS policy
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  },
  pingTimeout: 60000,
});

// Attach socket event listeners
initSocket(io);

// Start server after attempting MongoDB connection
const startServer = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.warn('[Startup Warning] Server starting in offline-DB mode. Check your MongoDB connection.');
  }

  server.listen(PORT, () => {
    console.log('========================================================');
    console.log(`🚨 NOOR DISASTER RELIEF COORDINATION PLATFORM 🚨`);
    console.log(`📡 Server running in [${process.env.NODE_ENV || 'development'}] mode on port ${PORT}`);
    console.log(`🌐 REST API:        http://localhost:${PORT}`);
    console.log(`🩺 Health Status:   http://localhost:${PORT}/api/health`);
    console.log(`⚡ WebSocket Stream: ws://localhost:${PORT}`);
    console.log('========================================================');
  });
};

startServer();

// Handle graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n[Shutdown] Received ${signal}. Closing HTTP and WebSocket connections...`);
  server.close(() => {
    console.log('[Shutdown] HTTP & Socket.io server closed.');
    process.exit(0);
  });

  // Force close after 10s if connections linger
  setTimeout(() => {
    console.error('[Shutdown Error] Forcefully terminating lingering connections.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err);
});
