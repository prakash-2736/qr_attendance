import express from "express";
import bcrypt from "bcryptjs";
import Member from "../models/Member.js";
import Attendance from "../models/Attendance.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ✅ GET ALL MEMBERS (Admin Only) */
router.get("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const members = await Member.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ✅ GET SINGLE MEMBER (Admin Only) */
router.get("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).select("-password");

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    const attendanceCount = await Attendance.countDocuments({
      memberId: member._id,
    });

    res.json({ member, attendanceCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ✅ CREATE MEMBER (Admin Only) */
router.post("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    const existingUser = await Member.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const member = await Member.create({
      name,
      email,
      password: hashedPassword,
      role: role || "member",
    });

    res.status(201).json({
      message: "Member created",
      member: {
        id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ✅ UPDATE MEMBER (Admin Only) */
router.put("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    if (name) member.name = name;
    if (email) member.email = email;
    if (role) member.role = role;
    if (password) {
      member.password = await bcrypt.hash(password, 10);
    }

    await member.save();

    res.json({
      message: "Member updated",
      member: {
        id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    }
    res.status(500).json({ message: error.message });
  }
});

/* ✅ DELETE MEMBER (Admin Only) */
router.delete("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Prevent deleting yourself
    if (member._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    await Attendance.deleteMany({ memberId: member._id });
    await Member.findByIdAndDelete(req.params.id);

    res.json({ message: "Member deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ✅ GET MEMBER STATS (Admin Dashboard) */
router.get(
  "/admin/stats",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const totalMembers = await Member.countDocuments();
      const byRole = await Member.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]);

      res.json({ totalMembers, byRole });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

export default router;
