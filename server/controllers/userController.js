const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Admin get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin update user
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, role } = req.body;

    const user = await User.findOne({
      _id: userId,
      isDeleted: false,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (role) user.role = role;

    await user.save();

    res.json({ message: "User updated", user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Soft delete user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({
      _id: userId,
      isDeleted: false,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    res.json({ message: "User soft deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Restore user
exports.restoreUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({
      _id: userId,
      isDeleted: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isDeleted = false;
    user.deletedAt = null;
    await user.save();

    res.json({ message: "User restored" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Change password securely
exports.changePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    const user = await User.findById(userId);

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: "Password updated securely" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
