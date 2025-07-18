// controllers/userController.js

const User = require('../models/User');

// Fetch all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ error: 'Server error fetching users' });
  }
};

// Create new user
const createUser = async (req, res) => {
  const { username } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username taken' });

    const user = new User({ username });
    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).json({ error: 'Server error creating user' });
  }
};

module.exports = {
  getAllUsers,
  createUser,
};
