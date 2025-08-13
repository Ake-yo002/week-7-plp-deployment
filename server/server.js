// server.js - Main server file for Socket.io chat application
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler');
const socketHandler = require('./socket'); // ✅ your modular socket handler

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Task 3.6 – Load saved messages on server startup
const messages = {};
const rooms = new Set(['General']);

rooms.forEach(room => {
  const filePath = path.join(__dirname, `${room}_messages.json`);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    messages[room] = JSON.parse(data);
    console.log(`Loaded messages for room ${room}`);
  }
});

// ✅ Modular socket handler
socketHandler(io);

// Routes
app.post('/api/save/:room', (req, res) => {
  const room = req.params.room;
  const data = JSON.stringify(messages[room] || [], null, 2);

  fs.writeFile(path.join(__dirname, `${room}_messages.json`), data, (err) => {
    if (err) {
      console.error('Error saving messages:', err);
      res.status(500).send('Error saving messages.');
    } else {
      res.send('Messages saved successfully.');
    }
  });
});

app.get('/api/messages/:room', (req, res) => {
  const room = req.params.room;
  res.json(messages[room] || []);
});

app.get('/api/users', (req, res) => {
  res.json([]); // placeholder
});

app.get('/api/rooms', (req, res) => {
  res.json(Array.from(rooms));
});

app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

app.use(errorHandler);

// ✅ Connect to MongoDB first, then start server
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected');
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1); // Stop server if DB fails
});

module.exports = { app, server, io };
