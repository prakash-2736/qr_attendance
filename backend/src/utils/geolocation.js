/**
 * IP-based geolocation utility
 * Uses free ip-api.com service to resolve IP to location
 */

export const getClientIP = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "unknown";
};

export const resolveLocation = async (ip) => {
  try {
    // Skip for local/private IPs
    if (
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip === "::ffff:127.0.0.1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip === "unknown"
    ) {
      return "Local Network";
    }

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=city,regionName,country`,
    );
    const data = await response.json();

    if (data.city && data.country) {
      return `${data.city}, ${data.regionName}, ${data.country}`;
    }

    return ip;
  } catch {
    return ip;
  }
};

/**
 * Calculate distance between two GPS coordinates using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lon1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lon2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
