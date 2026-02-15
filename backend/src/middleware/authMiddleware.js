import jwt from "jsonwebtoken";
import Member from "../models/Member.js";
import { getClientIP } from "../utils/geolocation.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await Member.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Validate this is the active session for this user
    if (user.activeToken && user.activeToken !== token) {
      return res.status(401).json({
        message: "Session expired — logged in from another device",
        code: "SESSION_REPLACED",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user.role}) not allowed`,
      });
    }
    next();
  };
};
