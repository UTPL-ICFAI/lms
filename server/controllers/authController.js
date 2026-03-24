const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// REGISTER USER
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN USER
exports.loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // If database is not connected, allow a demo admin login so the UI works
    if (mongoose.connection.readyState !== 1) {
      if (
        email === "admin@lms.com" &&
        password === "admin123" &&
        role === "admin"
      ) {
        const demoUser = {
          _id: "demo-admin-id",
          name: "Admin",
          email,
          role,
        };

        const token = generateToken(demoUser._id, demoUser.role);

        return res.json({
          message: "Login successful (demo mode, DB not connected)",
          token,
          user: {
            id: demoUser._id,
            name: demoUser.name,
            email: demoUser.email,
            role: demoUser.role,
          },
        });
      }

      return res
        .status(500)
        .json({ message: "Database not connected on this machine" });
    }

    let user = await User.findOne({ email });

    // If no user exists yet, auto-create the default admin so first login works
    if (!user && email === "admin@lms.com" && role === "admin") {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = await User.create({
        name: "Admin",
        email,
        password: hashedPassword,
        role: "admin",
      });
    }

    if (!user || user.role !== role) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
