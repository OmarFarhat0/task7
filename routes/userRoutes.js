const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const jwt = require("jsonwebtoken");

const router = express.Router();

// User registration
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ status: "fail", message: "All fields are required" });
    }

    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res
        .status(400)
        .json({ status: "fail", message: "All fields must be strings" });
    }

    // Check for spaces in any field
    if (/\s/.test(firstName) || /\s/.test(lastName) || /\s/.test(password)) {
      return res
        .status(400)
        .json({ status: "fail", message: "Fields should not contain spaces" });
    }

    // Minimum length checks
    if (firstName.length < 2 || lastName.length < 2) {
      return res.status(400).json({
        status: "fail",
        message: "First and Last name must be at least 2 characters long",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: "fail",
        message: "Password must be at least 6 characters long",
      });
    }

    // Email format validation (basic regex check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "fail",
        message: "Please enter a valid email address",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(400)
        .json({ status: "fail", message: "User already exists" });

    const user = new User(req.body);
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({ status: "success", token, data: user });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// User login
router.post("/login", authMiddleware, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res
        .status(400)
        .json({ status: "fail", message: "All fields must be strings" });
    }

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "fail", message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid email or password" });
    }

    res.status(200).json({ status: "success", data: user });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

// User logout
router.post("/logout", authMiddleware, (req, res) => {
  res.status(200).json({ status: "success", message: "Logout successful" });
});

module.exports = router;
