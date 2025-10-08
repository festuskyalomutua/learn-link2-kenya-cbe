server/socket/socketHandler.js:

const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error'));
      }
      
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.name;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userName} connected`);
    
    // Join user to their role-based room
    socket.join(socket.userRole);
    socket.join(`user_${socket.userId}`);

    // Handle assessment submission notifications
    socket.on('assessment_submitted', (data) => {
      // Notify teachers when students submit assessments
      socket.to('teacher').emit('new_submission', {
        type: 'assessment_submission',
        message: `${socket.userName} submitted ${data.assessmentTitle}`,
        studentId: socket.userId,
        assessmentId: data.assessmentId,
        timestamp: new Date()
      });
    });

    // Handle grading completion notifications
    socket.on('assessment_graded', (data) => {
      // Notify specific student when their assessment is graded
      socket.to(`user_${data.studentId}`).emit('assessment_graded', {
        type: 'grade_received',
        message: `Your ${data.assessmentTitle} has been graded`,
        grade: data.grade,
        feedback: data.feedback,
        timestamp: new Date()
      });
    });

    // Handle curriculum updates
    socket.on('curriculum_updated', (data) => {
      // Notify all stakeholders about curriculum changes
      socket.to('stakeholder').emit('curriculum_update', {
        type: 'curriculum_change',
        message: `Curriculum updated: ${data.title}`,
        changes: data.changes,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userName} disconnected`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Notification helper functions
const notifyUser = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit('notification', notification);
  }
};

const notifyRole = (role, notification) => {
  if (io) {
    io.to(role).emit('notification', notification);
  }
};

const broadcastToAll = (notification) => {
  if (io) {
    io.emit('notification', notification);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  notifyUser,
  notifyRole,
  broadcastToAll
};