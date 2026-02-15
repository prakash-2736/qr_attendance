import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import meetingRoutes from "./routes/meeting.js";
import attendanceRoutes from "./routes/attendance.js";
import qrRoutes from "./routes/qr.js";
import memberRoutes from "./routes/member.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/members", memberRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});
app.get("/", (req, res) => {
  res.send("QR Attendance API is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
