const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const socketEvents = require('../utils/socketEvents');
const { corsOptions } = require('../config/corsOptions');

/**
 * Initialize Socket.io server
 * @param {Server} httpServer - HTTP server instance
 */
function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: corsOptions,
  });

  // Set the IO instance in our socket events utility
  socketEvents.setIO(io);

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: Invalid user'));
      }

      // Attach user to socket
      socket.user = user;
      socket.organizationId = user.organization.toString();
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection event
  io.on('connection', (socket) => {
    console.log(`User ${socket.user.email} connected via socket`);

    // Join user's organization room
    socket.join(`org_${socket.organizationId}`);

    // Join user's personal room
    socket.join(`user_${socket.user.id}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.email} disconnected`);
    });

    // Join a specific room (e.g., for a specific incident or alert)
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
    });

    // Leave a room
    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
    });

    // Example: Subscribe to alert updates for organization
    socket.on('subscribe-alerts', () => {
      socket.join(`alerts_org_${socket.organizationId}`);
    });

    // Example: Subscribe to incident updates for organization
    socket.on('subscribe-incidents', () => {
      socket.join(`incidents_org_${socket.organizationId}`);
    });

    // Example: Subscribe to dashboard updates
    socket.on('subscribe-dashboard', () => {
      socket.join(`dashboard_org_${socket.organizationId}`);
    });
  });

  console.log('Socket.io initialized');
  return io;
}

module.exports = initializeSocket;