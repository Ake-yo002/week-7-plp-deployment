// controllers/messageController.js

const Message = require('../models/Message');

// Fetch messages by room
const getMessagesByRoom = async (req, res) => {
  const { room } = req.params;
  try {
    const messages = await Message.find({ room }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
};

// Save new message
const createMessage = async (messageData) => {
  try {
    const message = new Message(messageData);
    await message.save();
    return message;
  } catch (error) {
    console.error('Error saving message:', error.message);
  }
};

module.exports = {
  getMessagesByRoom,
  createMessage,
};
