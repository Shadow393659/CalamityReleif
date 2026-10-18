let ioInstance = null;
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizeRole } = require('../middleware/auth');

/**
 * Initialize Socket.io with client CORS configuration and event listeners
 * @param {import('socket.io').Server} io
 */
const initSocket = (io) => {
  ioInstance = io;

  io.use(async (socket, next) => {
    let payload;
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      payload = jwt.verify(
        token,
        process.env.JWT_SECRET || 'noor_disaster_secret_fallback_key'
      );
    } catch (err) {
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return next(new Error('Invalid or expired token'));
      }
      return next(err);
    }

    try {
      const user = await User.findById(payload.id);
      if (!user) return next(new Error('Account no longer exists'));
      socket.user = { id: String(user._id), accessRole: normalizeRole(user.role) };
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id} (Total: ${io.engine.clientsCount})`);
    socket.join(`user:${socket.user.id}`);
    if (['ngo', 'admin'].includes(socket.user.accessRole)) {
      socket.join('operations');
    }

    // Client can join a specific disaster zone/district room (e.g., 'Kendrapara', 'Puri')
    socket.on('join:district', (district) => {
      if (district && ['ngo', 'admin'].includes(socket.user.accessRole)) {
        socket.join(`district:${district}`);
        console.log(`[Socket.io] ${socket.id} joined district room: district:${district}`);
        socket.emit('joined:district', { district, message: `Subscribed to live alerts for ${district}` });
      }
    });

    // Client can join the Central Emergency Control Room room
    socket.on('join:control_room', () => {
      if (!['ngo', 'admin'].includes(socket.user.accessRole)) return;
      socket.join('operations');
      console.log(`[Socket.io] ${socket.id} joined control_room`);
      socket.emit('joined:control_room', { message: 'Subscribed to central emergency stream' });
    });

    // Client leaves district
    socket.on('leave:district', (district) => {
      if (district) {
        socket.leave(`district:${district}`);
        console.log(`[Socket.io] ${socket.id} left district:${district}`);
      }
    });

    // Handle ping/liveness
    socket.on('ping:status', (data) => {
      socket.emit('pong:status', { timestamp: new Date().toISOString(), server: 'Noor-Disaster-Core' });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
};

/**
 * Access the active Socket.io instance anywhere in the backend application
 */
const getIO = () => {
  if (!ioInstance) {
    console.warn('[Socket.io Warning] Socket.io has not been initialized yet.');
  }
  return ioInstance;
};

/**
 * Utility broadcaster for real-time distress events
 */
const broadcastDistressEvent = (eventName, data, districtZone = null) => {
  const io = getIO();
  if (!io) return;

  // Operational data is limited to authenticated response and admin roles.
  io.to('operations').emit(eventName, data);

  // Broadcast to specific district zone if specified
  if (districtZone) {
    io.to(`district:${districtZone}`).emit(eventName, data);
  }

  if (data.reportedBy) {
    io.to(`user:${data.reportedBy}`).emit(eventName, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  broadcastDistressEvent,
};
