// controllers/roomController.js

const Room = require('../models/Room');

// Fetch all rooms
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error.message);
    res.status(500).json({ error: 'Server error fetching rooms' });
  }
};

// Create new room
const createRoom = async (req, res) => {
  const { name } = req.body;
  try {
    const existing = await Room.findOne({ name });
    if (existing) return res.status(400).json({ error: 'Room already exists' });

    const room = new Room({ name });
    await room.save();
    res.json(room);
  } catch (error) {
    console.error('Error creating room:', error.message);
    res.status(500).json({ error: 'Server error creating room' });
  }
};

module.exports = {
  getAllRooms,
  createRoom,
};
