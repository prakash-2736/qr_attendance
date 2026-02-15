import express from "express";
import Meeting from "../models/Meeting.js";
import Attendance from "../models/Attendance.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { Parser } from "json2csv";
import ExcelJS from "exceljs";
import {
  getClientIP,
  resolveLocation,
  calculateDistance,
} from "../utils/geolocation.js";

const router = express.Router();

/* ✅ MARK ATTENDANCE */
router.post("/", protect, async (req, res) => {
  try {
    const { qrToken, latitude, longitude } = req.body;

    if (!qrToken) {
      return res.status(400).json({ message: "QR token missing" });
    }

    const meeting = await Meeting.findOne({ qrToken });
    if (!meeting) {
      return res.status(404).json({ message: "Invalid QR code" });
    }

    if (!meeting.isActive) {
      return res.status(403).json({ message: "Meeting is not active" });
    }

    const now = new Date();
    if (now < new Date(meeting.startTime)) {
      return res.status(403).json({ message: "Meeting has not started yet" });
    }
    if (now > new Date(meeting.endTime)) {
      return res
        .status(403)
        .json({ message: "Meeting has ended — QR expired" });
    }

    // Geofence check — if the meeting has a location set, verify proximity
    if (meeting.latitude != null && meeting.longitude != null) {
      if (latitude == null || longitude == null) {
        return res.status(400).json({
          message:
            "Location access is required. Please enable GPS and allow location permission.",
          code: "LOCATION_REQUIRED",
        });
      }

      const distance = calculateDistance(
        meeting.latitude,
        meeting.longitude,
        latitude,
        longitude,
      );

      if (distance > meeting.allowedRadius) {
        return res.status(403).json({
          message: `You are too far from the meeting venue (${Math.round(distance)}m away, must be within ${meeting.allowedRadius}m)`,
          code: "OUT_OF_RANGE",
        });
      }
    }

    // IP-based location
    const clientIP = getClientIP(req);
    const location = await resolveLocation(clientIP);

    // Check if this device (IP) already marked attendance for this meeting
    const existingFromDevice = await Attendance.findOne({
      deviceIP: clientIP,
      meetingId: meeting._id,
    });
    if (existingFromDevice) {
      return res.status(400).json({
        message: "Attendance already marked from this device",
      });
    }

    const attendance = await Attendance.create({
      memberId: req.user._id,
      meetingId: meeting._id,
      location,
      deviceIP: clientIP,
      memberLatitude: latitude || null,
      memberLongitude: longitude || null,
    });

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Attendance already marked for this meeting" });
    }
    res.status(500).json({ message: error.message });
  }
});

/* ✅ GET ATTENDANCE STATS (Admin Only) */
router.get("/stats", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const stats = await Attendance.aggregate([
      { $group: { _id: "$meetingId", count: { $sum: 1 } } },
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ✅ GET ATTENDANCE FOR A MEETING (Admin & PR) */
router.get(
  "/meeting/:meetingId",
  protect,
  authorizeRoles("admin", "pr"),
  async (req, res) => {
    try {
      const { meetingId } = req.params;

      const records = await Attendance.find({ meetingId })
        .populate("memberId", "name email role")
        .populate("meetingId", "title type startTime endTime")
        .sort({ createdAt: -1 });

      res.json(records);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

/* ✅ GET MY ATTENDANCE HISTORY (Member) */
router.get("/my", protect, async (req, res) => {
  try {
    const records = await Attendance.find({ memberId: req.user._id })
      .populate("meetingId", "title type startTime endTime")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ✅ EXPORT CSV (Admin Only) */
router.get(
  "/export/:meetingId",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { meetingId } = req.params;

      const records = await Attendance.find({ meetingId })
        .populate("memberId", "name email")
        .populate("meetingId", "title");

      if (!records.length) {
        return res.status(404).json({ message: "No attendance data" });
      }

      const data = records.map((r, i) => ({
        "S.No": i + 1,
        Name: r.memberId?.name || "N/A",
        Email: r.memberId?.email || "N/A",
        Meeting: r.meetingId?.title || "N/A",
        Location: r.location || "N/A",
        Time: new Date(r.timestamp).toLocaleString(),
      }));

      const parser = new Parser();
      const csv = parser.parse(data);

      res.header("Content-Type", "text/csv");
      res.attachment(`attendance-${meetingId}.csv`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

/* ✅ EXPORT EXCEL (Admin Only) */
router.get(
  "/export-excel/:meetingId",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { meetingId } = req.params;

      const records = await Attendance.find({ meetingId })
        .populate("memberId", "name email")
        .populate("meetingId", "title type startTime endTime");

      if (!records.length) {
        return res.status(404).json({ message: "No attendance data" });
      }

      const meetingTitle = records[0].meetingId?.title || "Meeting";

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Attendance");

      // Header styling
      sheet.columns = [
        { header: "S.No", key: "sno", width: 8 },
        { header: "Name", key: "name", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Location", key: "location", width: 25 },
        { header: "Time", key: "time", width: 25 },
      ];

      // Style header row
      sheet.getRow(1).font = { bold: true, size: 12 };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F46E5" },
      };
      sheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
        size: 12,
      };

      records.forEach((r, i) => {
        sheet.addRow({
          sno: i + 1,
          name: r.memberId?.name || "N/A",
          email: r.memberId?.email || "N/A",
          location: r.location || "N/A",
          time: new Date(r.timestamp).toLocaleString(),
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${meetingTitle}-attendance.xlsx"`,
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

/* ✅ GET LIVE ATTENDANCE COUNT */
router.get("/count/:meetingId", protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const count = await Attendance.countDocuments({ meetingId });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
