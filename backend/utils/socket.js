const socketIO = require('socket.io');

/**
 * Initialize Socket.IO for real-time updates
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.IO instance and middleware
 */
const initializeSocket = (server) => {
  // Allow CORS for socket connections. Accept configured client URL and any
  // localhost origin (useful for running frontend dev servers on different ports).
  const socketCorsOrigins = [process.env.CLIENT_URL, 'https://univento.vercel.app', /http:\/\/localhost:\d+/, /http:\/\/127\.0\.0\.1:\d+/];
  const io = socketIO(server, {
    cors: {
      origin: socketCorsOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Engine-level connection error logging (helpful for debugging upgrade/CORS/auth issues)
  try {
    io.engine.on('connection_error', (err) => {
      console.error('Socket engine connection_error:', err?.message || err);
    });
  } catch (e) {
    // Not critical; engine logging may not be available in some socket.io versions
    console.debug('Socket engine logging not available:', e?.message || e);
  }

  // Socket.IO namespace for leaderboard
  const leaderboardIO = io.of('/leaderboard');

  // Authentication middleware for socket connections
  leaderboardIO.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    // Simple validation - in production, verify JWT token
    next();
  });

  // Handle socket connections
  leaderboardIO.on('connection', (socket) => {
    console.log(`User connected to leaderboard: ${socket.id}`, 'handshake:', socket.handshake?.headers || {});

    // Join event-specific room
    socket.on('join-event', (eventId) => {
      socket.join(`event-${eventId}`);
      console.log(`User ${socket.id} joined event room: event-${eventId}`);
    });

    // Leave event-specific room
    socket.on('leave-event', (eventId) => {
      socket.leave(`event-${eventId}`);
      console.log(`User ${socket.id} left event room: event-${eventId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected from leaderboard: ${socket.id}`);
    });
  });

  // Handle general socket connections
  io.on('connection', (socket) => {
    // Log handshake details to help debug failed client connects
    console.log(`User connected: ${socket.id}`, {
      namespace: socket.nsp?.name,
      origin: socket.handshake?.headers?.origin,
      auth: !!socket.handshake?.auth,
      headers: socket.handshake?.headers
    });

    // Join event-specific rooms
    socket.on('joinEvent', (eventId) => {
      socket.join(`event-${eventId}`);
      console.log(`Socket ${socket.id} joined room: event-${eventId}`);
    });

    // Leave event-specific rooms
    socket.on('leaveEvent', (eventId) => {
      socket.leave(`event-${eventId}`);
      console.log(`Socket ${socket.id} left room: event-${eventId}`);
    });

    // Handle user role-based rooms
    socket.on('joinUserRole', (role) => {
      if (['admin', 'organizer', 'participant'].includes(role)) {
        socket.join(`role-${role}`);
        console.log(`Socket ${socket.id} joined room: role-${role}`);
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  // Middleware to attach socket.io to request object
  const socketMiddleware = (req, res, next) => {
    req.io = io;
    req.leaderboardIO = leaderboardIO;
    next();
  };

  // Utility functions for emitting events
  const emitToAll = (event, data) => {
    io.emit(event, data);
  };

  const emitToEvent = (eventId, event, data) => {
    io.to(`event-${eventId}`).emit(event, data);
  };

  const emitToRole = (role, event, data) => {
    io.to(`role-${role}`).emit(event, data);
  };

  const emitToLeaderboard = (eventId, event, data) => {
    leaderboardIO.to(`event-${eventId}`).emit(event, data);
  };

  return {
    io,
    leaderboardIO,
    socketMiddleware,
    emitToAll,
    emitToEvent,
    emitToRole,
    emitToLeaderboard
  };
};

module.exports = initializeSocket;