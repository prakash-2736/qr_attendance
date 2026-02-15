import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true, // 🚨 prevents duplicate users
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "pr", "member"],
      default: "member",
    },

    activeToken: {
      type: String,
      default: null,
    },

    activeIP: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Member", memberSchema);
