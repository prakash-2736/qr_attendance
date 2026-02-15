import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  QrCode,
  Users,
  Clock,
  Maximize2,
  Minimize2,
  Wifi,
  WifiOff,
  Eye,
} from "lucide-react";

const PRPanel = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [count, setCount] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await api.get("/meetings");
        // Show only active meetings
        setMeetings(res.data.filter((m) => m.isActive));
      } catch {
        console.error("Failed to load meetings");
      }
    };
    fetchMeetings();
  }, []);

  // Live attendance count polling
  useEffect(() => {
    if (!selectedMeeting) return;

    const fetchCount = async () => {
      try {
        const res = await api.get(`/attendance/count/${selectedMeeting._id}`);
        setCount(res.data.count);
      } catch {
        console.error("Count fetch failed");
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 3000);
    return () => clearInterval(interval);
  }, [selectedMeeting]);

  const getMeetingTimeStatus = (meeting) => {
    const now = new Date();
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);

    if (now < start) return { text: "Starts soon", color: "text-blue-400" };
    if (now > end) return { text: "Ended", color: "text-red-400" };
    return { text: "Live now", color: "text-emerald-400" };
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            QR Display
          </h1>
          <p className="text-slate-500 mt-1">
            Select a meeting to display its QR code
          </p>
        </div>
        {selectedMeeting && (
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {fullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
            {fullscreen ? "Exit" : "Fullscreen"}
          </button>
        )}
      </div>

      {/* Meeting Selector */}
      {!selectedMeeting ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {meetings.length === 0 && (
            <div className="col-span-full bg-white rounded-xl p-12 text-center border border-slate-100">
              <QrCode className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No active meetings</p>
              <p className="text-sm text-slate-400 mt-1">
                Ask admin to activate a meeting
              </p>
            </div>
          )}
          {meetings.map((meeting) => {
            const status = getMeetingTimeStatus(meeting);
            return (
              <button
                key={meeting._id}
                onClick={() => setSelectedMeeting(meeting)}
                className="bg-white rounded-2xl border border-slate-100 p-5 text-left hover:shadow-lg hover:border-indigo-200 transition-all duration-200 group hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 group-hover:scale-110 transition-all duration-300">
                    <QrCode className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className={`text-xs font-medium ${status.color}`}>
                    {status.text}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-800 mt-3">
                  {meeting.title}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    {meeting.type === "online" ? (
                      <Wifi className="w-3 h-3" />
                    ) : (
                      <WifiOff className="w-3 h-3" />
                    )}
                    {meeting.type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(meeting.startTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/pr/meetings/${meeting._id}`);
                  }}
                  className="mt-3 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </button>
              </button>
            );
          })}
        </div>
      ) : (
        /* QR Display */
        <div className="flex flex-col items-center">
          <button
            onClick={() => setSelectedMeeting(null)}
            className="mb-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            &larr; Back to meetings
          </button>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 max-w-md w-full text-center animate-scale-in">
            <h2 className="text-xl font-bold text-slate-800">
              {selectedMeeting.title}
            </h2>

            <div className="flex items-center justify-center gap-3 mt-2 mb-6">
              <span
                className={`text-sm font-medium ${getMeetingTimeStatus(selectedMeeting).color}`}
              >
                {getMeetingTimeStatus(selectedMeeting).text}
              </span>
              <span className="text-sm text-slate-400">
                {selectedMeeting.type}
              </span>
            </div>

            {/* Live Counter */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 mb-6 border border-indigo-100/50">
              <div className="flex items-center justify-center gap-2">
                <Users className="w-6 h-6 text-indigo-500" />
                <span className="text-4xl font-bold text-indigo-600 tabular-nums animate-count">
                  {count}
                </span>
              </div>
              <p className="text-sm text-indigo-400 mt-1">attendees marked</p>
            </div>

            {/* QR Code with pulse effect */}
            <div className="relative inline-flex items-center justify-center">
              <div
                className="absolute w-72 h-72 rounded-full bg-indigo-100 opacity-20 animate-ping"
                style={{ animationDuration: "3s" }}
              />
              <div className="absolute w-72 h-72 rounded-full animate-glow" />
              <div className="relative bg-white rounded-2xl p-3 shadow-lg border border-slate-100">
                <img
                  src={`http://localhost:5000/api/qr/${selectedMeeting.qrToken}`}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
            </div>

            <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl px-6 py-3 border border-indigo-100/50">
              <p className="text-xs text-indigo-400 font-medium">
                Attendance Code
              </p>
              <p className="text-4xl font-bold text-indigo-700 tracking-widest font-mono">
                {selectedMeeting.qrToken}
              </p>
            </div>

            <p className="text-sm text-slate-400 mt-4">
              Scan the QR code or enter the code to mark attendance
            </p>

            <button
              onClick={() => navigate(`/pr/meetings/${selectedMeeting._id}`)}
              className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Attendees
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PRPanel;
