import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["offline", "online"],
      required: true,
    },

    qrToken: {
      type: String,
      required: true,
      unique: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
    },

    // Geofencing fields (optional — if set, GPS proximity is enforced)
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    allowedRadius: {
      type: Number, // in meters
      default: 500,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Meeting", meetingSchema);
