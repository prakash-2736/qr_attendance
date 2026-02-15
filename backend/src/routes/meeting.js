import express from "express";
import QRCode from "qrcode";
import Meeting from "../models/Meeting.js";
import Attendance from "../models/Attendance.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

// Generate unique 6-digit code
const generate6DigitCode = async () => {
  let code;
  let exists = true;
  while (exists) {
    code = String(Math.floor(100000 + Math.random() * 900000));
    exists = await Meeting.findOne({ qrToken: code });
  }
  return code;
};

const router = express.Router();

/* ✅ CREATE MEETING (Admin Only) */
router.post("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const {
      title,
      type,
      startTime,
      endTime,
      latitude,
      longitude,
      allowedRadius,
    } = req.body;

    if (!title || !type || !startTime || !endTime) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return res
        .status(400)
        .json({ message: "End time must be after start time" });
    }

    const qrToken = await generate6DigitCode();

    const meetingData = {
      title,
      type,
      startTime,
      endTime,
      qrToken,
      createdBy: req.user._id,
    };

    // Add geofence fields if provided
    if (latitude != null && longitude != null) {
      meetingData.latitude = latitude;
      meetingData.longitude = longitude;
      meetingData.allowedRadius = allowedRadius || 500;
    } else if (allowedRadius) {
      // Admin set radius only — PR will set venue location later
      meetingData.allowedRadius = allowedRadius;
    }

    const meeting = await Meeting.create(meetingData);

    const qrImage = await QRCode.toDataURL(qrToken);

    res.status(201).json({
      message: "Meeting created",
      meeting,
      qrImage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ✅ GET ALL MEETINGS */
router.get("/", protect, async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ✅ GET SINGLE MEETING */
router.get("/:id", protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const qrImage = await QRCode.toDataURL(meeting.qrToken);

    const attendeeCount = await Attendance.countDocuments({
      meetingId: meeting._id,
    });

    res.json({ meeting, qrImage, attendeeCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ✅ UPDATE MEETING (Admin Only) */
router.put("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const {
      title,
      type,
      startTime,
      endTime,
      latitude,
      longitude,
      allowedRadius,
    } = req.body;

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (title) meeting.title = title;
    if (type) meeting.type = type;
    if (startTime) meeting.startTime = startTime;
    if (endTime) meeting.endTime = endTime;

    // Update geofence fields
    if (latitude != null && longitude != null) {
      meeting.latitude = latitude;
      meeting.longitude = longitude;
      meeting.allowedRadius = allowedRadius || meeting.allowedRadius || 500;
    } else if (latitude === null && longitude === null) {
      // Explicitly clear geofence
      meeting.latitude = null;
      meeting.longitude = null;
    }

    await meeting.save();

    res.json({ message: "Meeting updated", meeting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ✅ DELETE MEETING (Admin Only) */
router.delete("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Delete associated attendance records
    await Attendance.deleteMany({ meetingId: meeting._id });
    await Meeting.findByIdAndDelete(req.params.id);

    res.json({ message: "Meeting deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ✅ TOGGLE MEETING ACTIVE STATUS (Admin Only) */
router.patch(
  "/:id/toggle",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const meeting = await Meeting.findById(req.params.id);

      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      meeting.isActive = !meeting.isActive;
      await meeting.save();

      res.json({
        message: `Meeting ${meeting.isActive ? "Activated" : "Deactivated"}`,
        meeting,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

/* ✅ SET VENUE LOCATION (PR or Admin — sets geofence center from current GPS) */
router.patch(
  "/:id/set-location",
  protect,
  authorizeRoles("admin", "pr"),
  async (req, res) => {
    try {
      const { latitude, longitude } = req.body;

      if (latitude == null || longitude == null) {
        return res
          .status(400)
          .json({ message: "Latitude and longitude are required" });
      }

      const meeting = await Meeting.findById(req.params.id);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      meeting.latitude = latitude;
      meeting.longitude = longitude;
      await meeting.save();

      res.json({
        message: "Venue location updated — geofence is now active",
        meeting,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

/* ✅ GET DASHBOARD STATS (Admin Only) */
router.get(
  "/admin/stats",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const totalMeetings = await Meeting.countDocuments();
      const activeMeetings = await Meeting.countDocuments({ isActive: true });
      const totalAttendance = await Attendance.countDocuments();

      const recentMeetings = await Meeting.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("createdBy", "name");

      res.json({
        totalMeetings,
        activeMeetings,
        totalAttendance,
        recentMeetings,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

export default router;
