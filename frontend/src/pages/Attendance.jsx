import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { CheckCircle, XCircle, Loader2, QrCode, LogIn } from "lucide-react";

const Attendance = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error, login
  const [message, setMessage] = useState("");

  useEffect(() => {
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

    const markAttendance = async () => {
      const jwtToken = localStorage.getItem("token");

      if (!jwtToken) {
        setStatus("login");
        setMessage("Please log in to mark attendance");
        // Store the QR URL so we can redirect back after login
        localStorage.setItem("redirectAfterLogin", `/attendance/${token}`);
        return;
      }

      try {
        // Get GPS coordinates before submitting
        const coords = await getGPSPosition();
        const payload = { qrToken: token };
        if (coords) {
          payload.latitude = coords.latitude;
          payload.longitude = coords.longitude;
        }

        const res = await api.post("/attendance", payload);
        setStatus("success");
        setMessage(res.data.message);
      } catch (error) {
        setStatus("error");
        const code = error.response?.data?.code;
        if (code === "LOCATION_REQUIRED") {
          setMessage("Location access required. Please enable GPS and reload.");
        } else {
          setMessage(error.response?.data?.message || "Something went wrong");
        }
      }
    };

    if (token) markAttendance();
  }, [token]);

  const icons = {
    loading: <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />,
    success: <CheckCircle className="w-16 h-16 text-emerald-500" />,
    error: <XCircle className="w-16 h-16 text-red-500" />,
    login: <LogIn className="w-16 h-16 text-indigo-500" />,
  };

  const bgColors = {
    loading: "from-indigo-50 to-slate-50",
    success: "from-emerald-50 to-slate-50",
    error: "from-red-50 to-slate-50",
    login: "from-indigo-50 to-slate-50",
  };

  return (
    <div
      className={`min-h-screen bg-linear-to-br ${bgColors[status]} flex items-center justify-center p-4`}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-10 max-w-sm w-full text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-6">
          <QrCode className="w-6 h-6 text-indigo-600" />
        </div>

        {/* Status Icon */}
        <div className="flex justify-center mb-6">{icons[status]}</div>

        {/* Message */}
        <h2
          className={`text-xl font-bold ${
            status === "success"
              ? "text-emerald-700"
              : status === "error"
                ? "text-red-700"
                : "text-slate-800"
          }`}
        >
          {status === "loading" ? "Marking Attendance..." : message}
        </h2>

        {status === "loading" && (
          <p className="text-slate-400 text-sm mt-2">Please wait...</p>
        )}

        {status === "success" && (
          <p className="text-slate-400 text-sm mt-2">
            Your attendance has been recorded
          </p>
        )}

        {/* Login button if not authenticated */}
        {status === "login" && (
          <button
            onClick={() => navigate("/login")}
            className="mt-6 w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Go to Login
          </button>
        )}

        {/* Back button for success/error */}
        {(status === "success" || status === "error") && (
          <button
            onClick={() => {
              const user = JSON.parse(localStorage.getItem("user") || "{}");
              const routes = { admin: "/admin", pr: "/pr", member: "/member" };
              navigate(routes[user.role] || "/login");
            }}
            className="mt-6 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Go to Dashboard &rarr;
          </button>
        )}
      </div>
    </div>
  );
};

export default Attendance;
