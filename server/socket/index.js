// socket/index.js

const { saveMessage } = require("../controllers/messageController");
const { joinRoom, getRooms } = require("../controllers/roomController");
const User = require("../models/User");
const Room = require("../models/Room");

const typingUsers = {};

function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins with username
    socket.on("user_join", async (username) => {
      let user = await User.findOne({ username });
      if (!user) {
        user = new User({ username, socketId: socket.id, room: "General" });
      } else {
        user.socketId = socket.id;
      }
      await user.save();

      socket.join("General");

      const usersInRoom = await User.find({ room: "General" });
      io.to("General").emit("user_list", usersInRoom.map(u => u.username));
      io.to("General").emit("user_joined", { username, id: socket.id });

      console.log(`${username} joined General`);
    });

    // Join a room
    socket.on("join_room", async (roomName) => {
      if (!roomName) return;

      await joinRoom(socket, roomName);

      const rooms = await getRooms();
      io.emit("rooms_list", rooms);
    });

    // Send message
    socket.on("send_message", async (messageData) => {
      const message = await saveMessage(socket, messageData);
      io.to(message.room).emit("receive_message", message);
    });

    // Typing indicator (Task 3.3)
    socket.on("typing", async (isTyping) => {
      const user = await User.findOne({ socketId: socket.id });
      if (!user) return;

      if (isTyping) {
        typingUsers[socket.id] = { username: user.username, room: user.room };
      } else {
        delete typingUsers[socket.id];
      }

      const roomTypingUsers = Object.values(typingUsers)
        .filter(u => u.room === user.room && u.username !== user.username)
        .map(u => u.username);

      io.to(user.room).emit("typing_users", roomTypingUsers);
    });

    // Private message
    socket.on("private_message", async ({ toUsername, message }) => {
      const sender = await User.findOne({ socketId: socket.id });
      const recipient = await User.findOne({ username: toUsername });

      if (!recipient) {
        socket.emit("private_message_error", {
          error: `User ${toUsername} not found or not online.`,
        });
        return;
      }

      const messageData = {
        sender: sender.username,
        senderId: socket.id,
        recipient: toUsername,
        recipientId: recipient.socketId,
        message,
        timestamp: new Date().toISOString(),
        isPrivate: true,
      };

      io.to(recipient.socketId).emit("private_message", messageData);
      socket.emit("private_message", messageData);

      console.log(`Private message from ${sender.username} to ${toUsername}: ${message}`);
    });

    // Disconnect
    socket.on("disconnect", async () => {
      const user = await User.findOneAndDelete({ socketId: socket.id });
      if (user) {
        io.to(user.room).emit("user_left", { username: user.username, id: socket.id });
        console.log(`${user.username} disconnected from room ${user.room}`);
      }

      delete typingUsers[socket.id];
    });
  });
}

module.exports = socketHandler;
