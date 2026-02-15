import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";
import {
  History,
  CalendarDays,
  MapPin,
  Clock,
  CheckCircle,
  Wifi,
  WifiOff,
  ScanLine,
  Send,
  Camera,
  ImagePlus,
  X,
  Video,
  VideoOff,
} from "lucide-react";

const MemberDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrInput, setQrInput] = useState("");
  const [marking, setMarking] = useState(false);
  const [scanMode, setScanMode] = useState(null); // null | "camera" | "image"
  const [cameraActive, setCameraActive] = useState(false);
  const html5QrCodeRef = useRef(null);
  const scannerContainerRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/attendance/my");
      setRecords(res.data);
    } catch {
      console.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    return () => stopCamera();
  }, []);

  // Extract token from QR data (6-digit code, URL, or raw token)
  const extractToken = (data) => {
    // If it's just digits (6-digit code), return as-is
    const trimmed = data.trim();
    if (/^\d{6}$/.test(trimmed)) return trimmed;
    // Try to extract from URL pattern
    const match = trimmed.match(/\/attendance\/([a-f0-9]+)/i);
    return match ? match[1] : trimmed;
  };

  // Get current GPS position (returns null if unavailable/denied)
  const getGPSPosition = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  };

  // Submit attendance with a token
  const submitAttendance = async (token) => {
    if (marking) return;
    setMarking(true);
    try {
      // Get GPS coordinates before submitting
      toast.loading("Getting your location...", { id: "gps" });
      const coords = await getGPSPosition();
      toast.dismiss("gps");

      const payload = { qrToken: token };
      if (coords) {
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
      }

      const res = await api.post("/attendance", payload);
      toast.success(res.data.message);
      setQrInput("");
      stopCamera();
      setScanMode(null);
      fetchHistory();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to mark attendance";
      const code = error.response?.data?.code;
      if (code === "LOCATION_REQUIRED") {
        toast.error(
          "Please enable location/GPS to mark attendance for this meeting",
          { duration: 5000 },
        );
      } else if (code === "OUT_OF_RANGE") {
        toast.error(msg, { duration: 5000 });
      } else {
        toast.error(msg);
      }
    } finally {
      setMarking(false);
    }
  };

  // Manual form submit
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const input = qrInput.trim();
    if (!input) {
      toast.error("Please enter a QR code or paste the attendance link");
      return;
    }
    await submitAttendance(extractToken(input));
  };

  // Start camera scanner
  const startCamera = async () => {
    setScanMode("camera");
    setCameraActive(true);

    // Wait for DOM element to be available
    await new Promise((r) => setTimeout(r, 100));

    const scannerId = "qr-scanner-region";
    const el = document.getElementById(scannerId);
    if (!el) {
      toast.error("Scanner region not found");
      setCameraActive(false);
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // QR detected
          const token = extractToken(decodedText);
          stopCamera();
          submitAttendance(token);
        },
        () => {
          // Ignore scan failures (no QR in frame)
        },
      );
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Could not access camera. Check permissions.");
      setCameraActive(false);
      setScanMode(null);
    }
  };

  // Stop camera
  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current) {
        const state = html5QrCodeRef.current.getState();
        // 2 = SCANNING
        if (state === 2) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
    } catch {
      // ignore
    }
    setCameraActive(false);
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanMode("image");

    try {
      const html5QrCode = new Html5Qrcode("qr-image-scanner");
      const result = await html5QrCode.scanFile(file, true);
      const token = extractToken(result);
      html5QrCode.clear();
      await submitAttendance(token);
    } catch (err) {
      console.error("Image scan error:", err);
      toast.error("No QR code found in this image");
    }
    setScanMode(null);
    // Reset file input
    e.target.value = "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          My Attendance
        </h1>
        <p className="text-slate-500 mt-1">
          Scan QR or view your attendance history
        </p>
      </div>

      {/* Mark Attendance Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 p-5 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/10 rounded-full blur-xl" />
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Mark Attendance</h2>
              <p className="text-indigo-100 text-sm">
                Scan, upload, or paste QR code
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Scan Options - 3 buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                if (cameraActive) {
                  stopCamera();
                  setScanMode(null);
                } else {
                  startCamera();
                }
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                cameraActive
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-500/10"
                  : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-600"
              }`}
            >
              {cameraActive ? (
                <VideoOff className="w-6 h-6" />
              ) : (
                <Video className="w-6 h-6" />
              )}
              <span className="text-xs font-medium">
                {cameraActive ? "Stop Camera" : "Live Scan"}
              </span>
            </button>

            <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-600 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
              <ImagePlus className="w-6 h-6" />
              <span className="text-xs font-medium">Upload Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                stopCamera();
                setScanMode(scanMode === "paste" ? null : "paste");
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                scanMode === "paste"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-500/10"
                  : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-600"
              }`}
            >
              <Send className="w-6 h-6" />
              <span className="text-xs font-medium">Enter Code</span>
            </button>
          </div>

          {/* Camera Scanner */}
          {cameraActive && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                  <Camera className="w-4 h-4" />
                  Point camera at the QR code
                </p>
                <button
                  onClick={() => {
                    stopCamera();
                    setScanMode(null);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div
                id="qr-scanner-region"
                className="rounded-xl overflow-hidden border border-slate-200 bg-black"
                style={{ minHeight: "300px" }}
              />
            </div>
          )}

          {/* Hidden element for image scanning */}
          <div id="qr-image-scanner" className="hidden" />

          {/* Paste/Manual Entry */}
          {scanMode === "paste" && (
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <p className="text-sm text-slate-500">
                Enter the 6-digit attendance code shown on the QR:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="e.g. 482917"
                  maxLength={6}
                  autoFocus
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-center tracking-widest font-mono"
                />
                <button
                  type="submit"
                  disabled={marking}
                  className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white rounded-xl font-medium flex items-center gap-2 text-sm"
                >
                  {marking ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit
                </button>
              </div>
            </form>
          )}

          {/* Marking indicator */}
          {marking && (
            <div className="flex items-center justify-center gap-2 p-3 bg-indigo-50 rounded-lg text-indigo-700 text-sm">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              Marking attendance...
            </div>
          )}
        </div>
      </div>

      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm">Total Meetings Attended</p>
            <p className="text-4xl font-bold mt-1 animate-count">
              {records.length}
            </p>
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Attendance List */}
      {records.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-100">
          <History className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">
            No attendance records yet
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Scan a QR code at your next meeting
          </p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {records.map((record) => (
            <div
              key={record._id}
              className="bg-white rounded-2xl border border-slate-100 p-5 card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {record.meetingId?.title || "Unknown Meeting"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {new Date(
                          record.meetingId?.startTime || record.timestamp,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(record.timestamp).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {record.location || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    record.meetingId?.type === "online"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {record.meetingId?.type === "online" ? (
                    <Wifi className="w-3 h-3" />
                  ) : (
                    <WifiOff className="w-3 h-3" />
                  )}
                  {record.meetingId?.type || "N/A"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberDashboard;
