const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Register user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Please provide all fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ name, email, password: hash });

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d"
    });

    res.status(201).json({ 
      msg: "Registration successful", 
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ msg: "Server error during registration" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 Login attempt for:", email);

    // Validation
    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ msg: "Please provide email and password" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    // Check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log("❌ Invalid password for:", email);
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d"
    });

    console.log("✅ Login successful for:", email);
    console.log("🔑 Token generated (full):", token);
    console.log("🔑 Token preview:", token.substring(0, 50) + "...");
    console.log("👤 User ID:", user._id);

    res.json({ 
      msg: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ msg: "Server error during login" });
  }
});

// Get user profile (protected)
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
