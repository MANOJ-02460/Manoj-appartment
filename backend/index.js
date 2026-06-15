require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const routes = require('./Routs/routs');
const connectDB = require('./db');

const app = express();
connectDB();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/', routes);

// Socket.io Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id);

  // Register user/role to a room
  socket.on('register', ({ userId, role }) => {
    if (userId) socket.join(`user:${userId}`);
    if (role) socket.join(`role:${role}`);
    console.log(`🟢 ${socket.id} joined rooms: user:${userId} role:${role}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});













































// require("dotenv").config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const http = require('http');
// const { Server } = require('socket.io');
// const routs = require('./Routs/routs');
// const connectDB = require('./db');

// const app = express();

// // Connect to MongoDB
// connectDB();

// // Middleware
// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));

// // ✅ Body parsers (must come before routes)
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Routes
// app.use('/', routs);

// // SOCKET.IO SETUP
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: '*',
//     methods: ['GET', 'POST']
//   }
// });

// app.set('io', io);

// io.on('connection', (socket) => {
//   console.log('✅ New client connected:', socket.id);

//   socket.on('register', ({ userId, role }) => {
//     if (userId) socket.join(`user:${userId}`);
//     if (role) socket.join(`role:${role}`);
//     console.log(`Socket ${socket.id} joined rooms: user:${userId}, role:${role}`);
//   });

//   socket.on('disconnect', () => {
//     console.log('❌ Client disconnected:', socket.id);
//   });
// });

// const PORT = process.env.PORT || 4000;
// server.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });
