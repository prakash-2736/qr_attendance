import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  QrCode,
  Download,
  FileSpreadsheet,
  FileText,
  Wifi,
  WifiOff,
  ToggleLeft,
  ToggleRight,
  Trash2,
  RefreshCw,
  Search,
  UserCheck,
  Timer,
  Activity,
  ChevronDown,
  X,
  Navigation,
  Crosshair,
} from "lucide-react";

const MeetingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [meeting, setMeeting] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [liveCount, setLiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isPR = user?.role === "pr";

  const fetchMeeting = async () => {
    try {
      const res = await api.get(`/meetings/${id}`);
      setMeeting(res.data.meeting);
      setQrImage(res.data.qrImage);
      setLiveCount(res.data.attendeeCount);
    } catch (err) {
      toast.error("Failed to load meeting");
      navigate(-1);
    }
  };

  const fetchAttendees = async () => {
    try {
      const res = await api.get(`/attendance/meeting/${id}`);
      setAttendees(res.data);
    } catch {
      console.error("Failed to load attendees");
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchMeeting(), fetchAttendees()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  // Live polling — refresh count AND attendees list
  useEffect(() => {
    if (!meeting) return;
    const interval = setInterval(async () => {
      try {
        const [countRes, attendeesRes] = await Promise.all([
          api.get(`/attendance/count/${id}`),
          api.get(`/attendance/meeting/${id}`),
        ]);
        setLiveCount(countRes.data.count);
        setAttendees(attendeesRes.data);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [meeting, id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchMeeting(), fetchAttendees()]);
    setRefreshing(false);
    toast.success("Refreshed");
  };

  const handleSetVenueLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    toast.loading("Getting your location...", { id: "venue-gps" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        toast.dismiss("venue-gps");
        try {
          const res = await api.patch(`/meetings/${id}/set-location`, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          toast.success(res.data.message);
          fetchMeeting();
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to set location");
        }
      },
      (err) => {
        toast.dismiss("venue-gps");
        toast.error("Failed to get location: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleToggle = async () => {
    try {
      const res = await api.patch(`/meetings/${id}/toggle`);
      toast.success(res.data.message);
      fetchMeeting();
    } catch {
      toast.error("Toggle failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this meeting and all its attendance records?")) return;
    try {
      await api.delete(`/meetings/${id}`);
      toast.success("Meeting deleted");
      navigate(-1);
    } catch {
      toast.error("Delete failed");
    }
  };

  const downloadQR = () => {
    if (!qrImage) return;
    const a = document.createElement("a");
    a.href = qrImage;
    a.download = `qr-${meeting.title}.png`;
    a.click();
  };

  const exportCSV = async () => {
    try {
      const res = await api.get(`/attendance/export/${id}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${meeting.title}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  };

  const exportExcel = async () => {
    try {
      const res = await api.get(`/attendance/export-excel/${id}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${meeting.title}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  };

  const getStatus = () => {
    if (!meeting) return {};
    const now = new Date();
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);

    if (!meeting.isActive)
      return {
        text: "Inactive",
        color: "bg-slate-100 text-slate-600",
        dot: "bg-slate-400",
      };
    if (now < start)
      return {
        text: "Upcoming",
        color: "bg-blue-100 text-blue-700",
        dot: "bg-blue-500",
      };
    if (now > end)
      return {
        text: "Ended",
        color: "bg-red-100 text-red-700",
        dot: "bg-red-500",
      };
    return {
      text: "Live",
      color: "bg-emerald-100 text-emerald-700",
      dot: "bg-emerald-500 animate-pulse",
    };
  };

  const getDuration = () => {
    if (!meeting) return "";
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);
    const diff = Math.abs(end - start) / 60000;
    if (diff < 60) return `${Math.round(diff)} min`;
    const hrs = Math.floor(diff / 60);
    const mins = Math.round(diff % 60);
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const filtered = attendees.filter((a) => {
    const name = a.memberId?.name?.toLowerCase() || "";
    const email = a.memberId?.email?.toLowerCase() || "";
    return (
      name.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!meeting) return null;

  const status = getStatus();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Title Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="mt-1 p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">
                {meeting.title}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.text}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                {meeting.type === "online" ? (
                  <Wifi className="w-3.5 h-3.5" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5" />
                )}
                {meeting.type}
              </span>
              {meeting.createdBy && <span>by {meeting.createdBy.name}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors ${refreshing ? "animate-spin" : ""}`}
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={handleToggle}
                className={`p-2 rounded-xl transition-colors ${
                  meeting.isActive
                    ? "text-emerald-600 hover:bg-emerald-50"
                    : "text-slate-400 hover:bg-slate-100"
                }`}
                title={meeting.isActive ? "Deactivate" : "Activate"}
              >
                {meeting.isActive ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={handleDelete}
                className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {/* Date */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 card-hover">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Date
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {new Date(meeting.startTime).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Time */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 card-hover">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Time
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {new Date(meeting.startTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" — "}
            {new Date(meeting.endTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Duration */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 card-hover">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Timer className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Duration
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {getDuration()}
          </p>
        </div>

        {/* Attendees */}
        <div className="bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-500/20">
          <div className="flex items-center gap-2 text-indigo-100 mb-2">
            <UserCheck className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Attended
            </span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold">{liveCount}</p>
            {status.text === "Live" && (
              <Activity className="w-5 h-5 text-indigo-200 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* QR Code + Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* QR Code Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col items-center card-hover">
          <p className="text-sm font-medium text-slate-500 mb-3">
            Meeting QR Code
          </p>
          {qrImage ? (
            <>
              <div
                className="bg-slate-50 rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setShowQR(true)}
              >
                <img src={qrImage} alt="QR" className="w-40 h-40" />
              </div>
              <div className="mt-3 bg-indigo-50 rounded-lg px-4 py-2 text-center">
                <p className="text-xs text-indigo-400 font-medium">
                  Attendance Code
                </p>
                <p className="text-2xl font-bold text-indigo-700 tracking-widest font-mono">
                  {meeting.qrToken}
                </p>
              </div>
              <button
                onClick={downloadQR}
                className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </>
          ) : (
            <div className="w-40 h-40 bg-slate-100 rounded-xl flex items-center justify-center">
              <QrCode className="w-10 h-10 text-slate-300" />
            </div>
          )}
        </div>

        {/* Actions Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-medium text-slate-500 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setShowQR(true)}
              className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
            >
              <QrCode className="w-5 h-5 text-indigo-500" />
              <span className="text-xs font-medium text-slate-600">
                View QR
              </span>
            </button>
            <button
              onClick={handleRefresh}
              className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
            >
              <RefreshCw className="w-5 h-5 text-indigo-500" />
              <span className="text-xs font-medium text-slate-600">
                Refresh
              </span>
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={exportCSV}
                  disabled={attendees.length === 0}
                  className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileText className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-medium text-slate-600">
                    Export CSV
                  </span>
                </button>
                <button
                  onClick={exportExcel}
                  disabled={attendees.length === 0}
                  className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-medium text-slate-600">
                    Export Excel
                  </span>
                </button>
                <button
                  onClick={handleToggle}
                  className={`flex flex-col items-center gap-2 p-4 border rounded-xl transition-all ${
                    meeting.isActive
                      ? "border-amber-200 hover:bg-amber-50/50 hover:border-amber-300"
                      : "border-emerald-200 hover:bg-emerald-50/50 hover:border-emerald-300"
                  }`}
                >
                  {meeting.isActive ? (
                    <ToggleLeft className="w-5 h-5 text-amber-500" />
                  ) : (
                    <ToggleRight className="w-5 h-5 text-emerald-500" />
                  )}
                  <span className="text-xs font-medium text-slate-600">
                    {meeting.isActive ? "Deactivate" : "Activate"}
                  </span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-red-300 hover:bg-red-50/50 transition-all"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <span className="text-xs font-medium text-slate-600">
                    Delete
                  </span>
                </button>
              </>
            )}
            {/* Set Venue Location — for PR or Admin */}
            {(isAdmin || isPR) && (
              <button
                onClick={handleSetVenueLocation}
                className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50/50 transition-all"
              >
                <Crosshair className="w-5 h-5 text-cyan-600" />
                <span className="text-xs font-medium text-slate-600">
                  Set Venue
                </span>
              </button>
            )}
          </div>

          {/* Geofence info */}
          {meeting.latitude != null && (
            <div className="mt-4 flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700">
              <Navigation className="w-3.5 h-3.5 shrink-0" />
              <span>
                Geofence active — {meeting.allowedRadius}m radius at (
                {meeting.latitude.toFixed(5)}, {meeting.longitude.toFixed(5)})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Attendees Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Attendees
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {filtered.length} of {attendees.length} record
                {attendees.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">
              {attendees.length === 0
                ? "No attendees yet"
                : "No matching results"}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {attendees.length === 0
                ? "Attendance will appear here as members scan the QR"
                : "Try a different search term"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table — hidden on mobile */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/70">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      #
                    </th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Member
                    </th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Role
                    </th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Location
                    </th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      GPS
                    </th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((record, i) => (
                    <tr
                      key={record._id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 px-5 text-sm text-slate-400">
                        {i + 1}
                      </td>
                      <td className="py-3 px-5">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {record.memberId?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {record.memberId?.email || ""}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            record.memberId?.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : record.memberId?.role === "pr"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {record.memberId?.role || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-50">
                            {record.location || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        {record.memberLatitude != null ? (
                          <a
                            href={`https://www.google.com/maps?q=${record.memberLatitude},${record.memberLongitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 font-mono bg-cyan-50 px-2 py-1 rounded-lg hover:bg-cyan-100 transition-colors"
                            title={`${record.memberLatitude.toFixed(5)}, ${record.memberLongitude.toFixed(5)}`}
                          >
                            <Navigation className="w-3 h-3" />
                            {record.memberLatitude.toFixed(4)},{" "}
                            {record.memberLongitude.toFixed(4)}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <div className="text-sm text-slate-600">
                          {new Date(record.timestamp).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            },
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(record.timestamp).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards — visible only on mobile */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map((record, i) => (
                <div
                  key={record._id}
                  className="p-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {record.memberId?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {record.memberId?.email || ""}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        record.memberId?.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : record.memberId?.role === "pr"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {record.memberId?.role || "—"}
                    </span>
                  </div>
                  <div className="mt-2 ml-11 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-37.5">
                        {record.location || "N/A"}
                      </span>
                    </span>
                    {record.memberLatitude != null && (
                      <a
                        href={`https://www.google.com/maps?q=${record.memberLatitude},${record.memberLongitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700"
                      >
                        <Navigation className="w-3 h-3" />
                        GPS
                      </a>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(record.timestamp).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" · "}
                      {new Date(record.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Fullscreen QR Modal */}
      {showQR && qrImage && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center relative animate-scale-in">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              {meeting.title}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Scan to mark attendance
            </p>
            <div className="bg-slate-50 rounded-xl p-4 mb-2">
              <img src={qrImage} alt="QR Code" className="w-64 h-64 mx-auto" />
            </div>
            <div className="bg-indigo-50 rounded-lg px-4 py-2 mb-4">
              <p className="text-xs text-indigo-400 font-medium">Code</p>
              <p className="text-3xl font-bold text-indigo-700 tracking-widest font-mono">
                {meeting.qrToken}
              </p>
            </div>
            <button
              onClick={downloadQR}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download QR
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MeetingDetail;
