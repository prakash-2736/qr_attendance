import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Member from "../models/Member.js";
import { protect } from "../middleware/authMiddleware.js";
import { getClientIP } from "../utils/geolocation.js";

const router = express.Router();

/* ✅ REGISTER (Member only — admin assigns other roles) */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await Member.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await Member.create({
      name,
      email,
      password: hashedPassword,
      role: "member",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ✅ LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Member.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Store active session (IP + token) — enforces single device login
    const clientIP = getClientIP(req);
    user.activeToken = token;
    user.activeIP = clientIP;
    await user.save();

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
    res.status(500).json({ message: error.message });
  }
});

/* ✅ LOGOUT — clear active session */
router.post("/logout", protect, async (req, res) => {
  try {
    req.user.activeToken = null;
    req.user.activeIP = null;
    await req.user.save();
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ✅ GET CURRENT USER */
router.get("/me", protect, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
