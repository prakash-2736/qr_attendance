import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },

    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },

    location: {
      type: String,
    },

    deviceIP: {
      type: String,
    },

    memberLatitude: {
      type: Number,
      default: null,
    },

    memberLongitude: {
      type: Number,
      default: null,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

/* 🚨 Prevent duplicate attendance for same meeting */
attendanceSchema.index({ memberId: 1, meetingId: 1 }, { unique: true });

/* 🚨 Prevent same device (IP) from marking attendance for different accounts */
attendanceSchema.index({ deviceIP: 1, meetingId: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
