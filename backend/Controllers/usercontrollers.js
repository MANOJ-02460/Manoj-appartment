const mongoose = require('mongoose');
const User = require('../Models/users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ name, email, phone, passwordHash, role });
    await user.save();

    // Auto-create a Community if the role is admin
    if (role === 'admin') {
      const Community = require('../Models/community');
      const defaultCommunity = new Community({
        name: `${name}'s Community`,
        address: 'To Be Updated', // Required by schema
        admins: [user._id]
      });
      await defaultCommunity.save();
      
      user.community = defaultCommunity._id;
      await user.save();
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};




exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({
      success: false, message: 'Invalid credentials'
    });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({
      success: false, message: 'Invalid credentials'
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });
    res.json({ success: true, token, user });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false, message: 'Server error'
    });
  }
};





// Get all users (only superadmin or subadmin)  //
exports.getAllUsers = async (req, res) => {
  try {
    const query = req.user && req.user.community ? { community: req.user.community } : {};
    const users = await User.find(query).select('-passwordHash');
    res.json({
      success: true, users
    });
  } catch (error) {
    res.status(500).json({
      success: false, message: 'Server error'
    });
  }
};




exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({
      success: false, message: 'User not found'
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false, message: 'Server error'
    });
  }
};




exports.updateUser = async (req, res) => {
  try {
    const updates = req.body;

    // If password update, hash it
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(updates.password, salt);
      delete updates.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({
      success: false, message: 'User not found'
    });

    res.json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({
      success: false, message: 'Server error'
    });
  }
};





// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({
      success: false, message: 'User not found'
    });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false, message: 'Server error'
    });
  }
};
